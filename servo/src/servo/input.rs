fn input(
    osmain_ch: comm::chan<osmain::msg>,
    draw_ch: comm::chan<gfx::compositor::msg>,
    model_ch: comm::chan<()>
) {
    task::spawn {||
        let key_po = comm::port();
        comm::send(osmain_ch, osmain::add_key_handler(comm::chan(key_po)));
        loop {
            alt comm::recv(key_po) {
              _ {
                comm::send(model_ch, ());
                let draw_exit_confirm_po = comm::port();
                comm::send(draw_ch, gfx::compositor::exit(comm::chan(draw_exit_confirm_po)));
                comm::recv(draw_exit_confirm_po);
                comm::send(osmain_ch, osmain::exit);
                break;
              }
            }
        }
    }
}
