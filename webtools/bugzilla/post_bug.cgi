#!/usr/bonsaitools/bin/perl -wT
# -*- Mode: perl; indent-tabs-mode: nil -*-
#
# The contents of this file are subject to the Mozilla Public
# License Version 1.1 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of
# the License at http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS
# IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
# implied. See the License for the specific language governing
# rights and limitations under the License.
#
# The Original Code is the Bugzilla Bug Tracking System.
#
# The Initial Developer of the Original Code is Netscape Communications
# Corporation. Portions created by Netscape are
# Copyright (C) 1998 Netscape Communications Corporation. All
# Rights Reserved.
#
# Contributor(s): Terry Weissman <terry@mozilla.org>
#                 Dan Mosedale <dmose@mozilla.org>
#                 Joe Robins <jmrobins@tgix.com>
#                 Gervase Markham <gerv@gerv.net>

use strict;
use lib qw(.);

require "CGI.pl";
require "bug_form.pl";

# Shut up misguided -w warnings about "used only once". For some reason,
# "use vars" chokes on me when I try it here.
sub sillyness {
    my $zz;
    $zz = $::buffer;
    $zz = %::COOKIE;
    $zz = %::components;
    $zz = %::versions;
    $zz = @::legal_opsys;
    $zz = @::legal_platform;
    $zz = @::legal_priority;
    $zz = @::legal_product;
    $zz = @::legal_severity;
    $zz = %::target_milestone;
}

# Use global template variables.
use vars qw($vars $template);

ConnectToDatabase();
confirm_login();


# The format of the initial comment can be structured by adding fields to the
# enter_bug template and then referencing them in the comment template.
my $comment;

$vars->{'form'} = \%::FORM;

my $format = GetFormat("bug/create/comment", $::FORM{'format'}, "txt");

$template->process($format->{'template'}, $vars, \$comment)
  || ThrowTemplateError($template->error());

ValidateComment($comment);

my $product = $::FORM{'product'};
my $product_id = get_product_id($product);
if (!$product_id) {
    $vars->{'product'} = $product;
    ThrowUserError("invalid_product_name");
}

# Set cookies
my $cookiepath = Param("cookiepath");
if (exists $::FORM{'product'}) {
    if (exists $::FORM{'version'}) {           
        print "Set-Cookie: VERSION-$product=$::FORM{'version'} ; " .
              "path=$cookiepath ; expires=Sun, 30-Jun-2029 00:00:00 GMT\n"; 
    }
}

if (defined $::FORM{'maketemplate'}) {
    $vars->{'url'} = $::buffer;
    
    print "Content-type: text/html\n\n";
    $template->process("bug/create/make-template.html.tmpl", $vars)
      || ThrowTemplateError($template->error());
    exit;
}

umask 0;

# Some sanity checking
if(Param("usebuggroupsentry") && GroupExists($product)) {
    if(!UserInGroup($product)) {
        DisplayError("Sorry; you do not have the permissions necessary to enter
                      a bug against this product.", "Permission Denied");
        exit;
    }
}

my $component_id = get_component_id($product_id, $::FORM{component});
if (!$component_id) {
    DisplayError("You must choose a component that corresponds to this bug.
                  If necessary, just guess.");
    exit;
}

if (!defined $::FORM{'short_desc'} || trim($::FORM{'short_desc'}) eq "") {
    DisplayError("You must enter a summary for this bug.");
    exit;
}

# If bug_file_loc is "http://", the default, strip it out and use an empty
# value. 
$::FORM{'bug_file_loc'} = "" if $::FORM{'bug_file_loc'} eq 'http://';
    
my $sql_product = SqlQuote($::FORM{'product'});
my $sql_component = SqlQuote($::FORM{'component'});

# Default assignee is the component owner.
if ($::FORM{'assigned_to'} eq "") {
    SendSQL("SELECT initialowner FROM components " .
            "WHERE id = $component_id");
    $::FORM{'assigned_to'} = FetchOneColumn();
} else {
    $::FORM{'assigned_to'} = DBNameToIdAndCheck(trim($::FORM{'assigned_to'}));
}

my @bug_fields = ("version", "rep_platform",
                  "bug_severity", "priority", "op_sys", "assigned_to",
                  "bug_status", "bug_file_loc", "short_desc",
                  "target_milestone");

if (Param("useqacontact")) {
    SendSQL("SELECT initialqacontact FROM components " .
            "WHERE id = $component_id");
    my $qa_contact = FetchOneColumn();
    if (defined $qa_contact && $qa_contact != 0) {
        $::FORM{'qa_contact'} = $qa_contact;
        push(@bug_fields, "qa_contact");
    }
}

if (UserInGroup("canedit") || UserInGroup("canconfirm")) {
    # Default to NEW if the user hasn't selected another status
    $::FORM{'bug_status'} ||= "NEW";
} else {
    # Default to UNCONFIRMED if we are using it, NEW otherwise
    $::FORM{'bug_status'} = $::unconfirmedstate;
    SendSQL("SELECT votestoconfirm FROM products WHERE id = $product_id");
    if (!FetchOneColumn()) {
        $::FORM{'bug_status'} = "NEW";
    }
}

if (!exists $::FORM{'target_milestone'}) {
    SendSQL("SELECT defaultmilestone FROM products WHERE name=$sql_product");
    $::FORM{'target_milestone'} = FetchOneColumn();
}

if (!Param('letsubmitterchoosepriority')) {
    $::FORM{'priority'} = Param('defaultpriority');
}

GetVersionTable();

# Some more sanity checking
CheckFormField(\%::FORM, 'product',      \@::legal_product);
CheckFormField(\%::FORM, 'rep_platform', \@::legal_platform);
CheckFormField(\%::FORM, 'bug_severity', \@::legal_severity);
CheckFormField(\%::FORM, 'priority',     \@::legal_priority);
CheckFormField(\%::FORM, 'op_sys',       \@::legal_opsys);
CheckFormField(\%::FORM, 'bug_status',   [$::unconfirmedstate, 'NEW']);
CheckFormField(\%::FORM, 'version',          $::versions{$product});
CheckFormField(\%::FORM, 'component',        $::components{$product});
CheckFormField(\%::FORM, 'target_milestone', $::target_milestone{$product});
CheckFormFieldDefined(\%::FORM, 'assigned_to');
CheckFormFieldDefined(\%::FORM, 'bug_file_loc');
CheckFormFieldDefined(\%::FORM, 'comment');

my @used_fields;
foreach my $field (@bug_fields) {
    if (exists $::FORM{$field}) {
        push (@used_fields, $field);
    }
}

if (exists $::FORM{'bug_status'} 
    && $::FORM{'bug_status'} ne $::unconfirmedstate) 
{
    push(@used_fields, "everconfirmed");
    $::FORM{'everconfirmed'} = 1;
}

$::FORM{'product_id'} = $product_id;
push(@used_fields, "product_id");
$::FORM{component_id} = $component_id;
push(@used_fields, "component_id");

my %ccids;
my @cc;

# Create the ccid hash for inserting into the db
# and the list for passing to processmail
# use a hash rather than a list to avoid adding users twice
if (defined $::FORM{'cc'}) {
    foreach my $person (split(/[ ,]/, $::FORM{'cc'})) {
        if ($person ne "") {
            my $ccid = DBNameToIdAndCheck($person);
            if ($ccid && !$ccids{$ccid}) {
                $ccids{$ccid} = 1;
                push(@cc, $person);
            }
        }
    }
}
# Check for valid keywords and create list of keywords to be added to db
# (validity routine copied from process_bug.cgi)
my @keywordlist;
my %keywordseen;

if ($::FORM{'keywords'} && UserInGroup("editbugs")) {
    foreach my $keyword (split(/[\s,]+/, $::FORM{'keywords'})) {
        if ($keyword eq '') {
           next;
        }
        my $i = GetKeywordIdFromName($keyword);
        if (!$i) {
            $vars->{'keyword'} = $keyword;
            ThrowUserError("unknown_keyword");
        }
        if (!$keywordseen{$i}) {
            push(@keywordlist, $i);
            $keywordseen{$i} = 1;
        }
    }
}

# Build up SQL string to add bug.
my $sql = "INSERT INTO bugs " . 
  "(" . join(",", @used_fields) . ", reporter, creation_ts) " . 
  "VALUES (";

foreach my $field (@used_fields) {
    $sql .= SqlQuote($::FORM{$field}) . ",";
}

$comment =~ s/\r\n?/\n/g;     # Get rid of \r.
$comment = trim($comment);
# If comment is all whitespace, it'll be null at this point. That's
# OK except for the fact that it causes e-mail to be suppressed.
$comment = $comment ? $comment : " ";

$sql .= "$::userid, now() )";

# Groups
my @groupstoadd = ();
foreach my $b (grep(/^bit-\d*$/, keys %::FORM)) {
    if ($::FORM{$b}) {
        my $v = substr($b, 4);
        $v =~ /^(\d+)$/
          || ThrowCodeError("group_id_invalid", undef, "abort");
        if (!GroupIsActive($v)) {
            # Prevent the user from adding the bug to an inactive group.
            # Should only happen if there is a bug in Bugzilla or the user
            # hacked the "enter bug" form since otherwise the UI 
            # for adding the bug to the group won't appear on that form.
            $vars->{'bit'} = $v;
            ThrowCodeError("inactive_group", undef, "abort");
        }
        SendSQL("SELECT user_id FROM user_group_map 
                 WHERE user_id = $::userid
                 AND group_id = $v
                 AND isbless = 0");
        my ($member) = FetchSQLData();
        if ($member) {
            push(@groupstoadd, $v)
        }
    }
}


# Lock tables before inserting records for the new bug into the database
# if we are using a shadow database to prevent shadow database corruption
# when two bugs get created at the same time.
SendSQL("LOCK TABLES bugs WRITE, bug_group_map WRITE, longdescs WRITE, cc WRITE, profiles READ") if Param("shadowdb");

# Add the bug report to the DB.
SendSQL($sql);

# Get the bug ID back.
SendSQL("select LAST_INSERT_ID()");
my $id = FetchOneColumn();

# Add the group restrictions
foreach my $grouptoadd (@groupstoadd) {
    SendSQL("INSERT INTO bug_group_map (bug_id, group_id)
             VALUES ($id, $grouptoadd)");
}

# Add the comment
SendSQL("INSERT INTO longdescs (bug_id, who, bug_when, thetext) 
         VALUES ($id, $::userid, now(), " . SqlQuote($comment) . ")");

# Insert the cclist into the database
foreach my $ccid (keys(%ccids)) {
    SendSQL("INSERT INTO cc (bug_id, who) VALUES ($id, $ccid)");
}

if (UserInGroup("editbugs")) {
    foreach my $keyword (@keywordlist) {
        SendSQL("INSERT INTO keywords (bug_id, keywordid) 
                 VALUES ($id, $keyword)");
    }
}

SendSQL("UNLOCK TABLES") if Param("shadowdb");

# Assemble the -force* strings so this counts as "Added to this capacity"
my @ARGLIST = ();
if (@cc) {
    push (@ARGLIST, "-forcecc", join(",", @cc));
}

push (@ARGLIST, "-forceowner", DBID_to_name($::FORM{assigned_to}));

if (defined $::FORM{'qa_contact'}) {
    push (@ARGLIST, "-forceqacontact", DBID_to_name($::FORM{'qa_contact'}));
}

push (@ARGLIST, "-forcereporter", DBID_to_name($::userid));

push (@ARGLIST, $id, $::COOKIE{'Bugzilla_login'});

# Send mail to let people know the bug has been created.
# See attachment.cgi for explanation of why it's done this way.
my $mailresults = '';
open(PMAIL, "-|") or exec('./processmail', @ARGLIST);
$mailresults .= $_ while <PMAIL>;
close(PMAIL);

# Tell the user all about it
$vars->{'id'} = $id;
$vars->{'mail'} = $mailresults;
$vars->{'type'} = "created";

print "Content-type: text/html\n\n";
$template->process("bug/create/created.html.tmpl", $vars)
  || ThrowTemplateError($template->error());

$::FORM{'id'} = $id;

show_bug("header is already done");
