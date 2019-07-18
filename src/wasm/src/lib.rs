extern crate spdcalc;
extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC : wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn browser_debug() {
  // When the `console_error_panic_hook` feature is enabled, we can call the
  // `set_panic_hook` function at least once during initialization, and then
  // we will get better error messages if our code ever panics.
  //
  // For more details see
  // https://github.com/rustwasm/console_error_panic_hook#readme
  #[cfg(feature = "console_error_panic_hook")]
  console_error_panic_hook::set_once();
}

use spdcalc::{
  dim::{
    f64prefixes::{MICRO, MILLI, NANO},
    ucum::{DEG, M},
  },
  photon::Photon,
  spd::SPD,
};

#[wasm_bindgen]
pub fn get_jsi_data(width : usize, height : usize) -> Vec<f64> {
  let crystal_setup = spdcalc::crystal::CrystalSetup {
    crystal :     spdcalc::crystal::Crystal::BBO_1,
    pm_type :     spdcalc::crystal::PMType::Type1_e_oo,
    theta :       90. * DEG,
    phi :         0. * DEG,
    length :      2_000.0 * MICRO * M,
    temperature : spdcalc::utils::from_celsius_to_kelvin(20.0),
  };

  let waist = spdcalc::WaistSize::new(spdcalc::na::Vector2::new(100.0 * MICRO, 100.0 * MICRO));
  let signal = Photon::signal(0. * DEG, 0. * DEG, 1550. * NANO * M, waist);
  let idler = Photon::idler(180. * DEG, 0. * DEG, 1550. * NANO * M, waist);
  let pump = Photon::pump(775. * NANO * M, waist);

  let mut params = SPD {
    signal,
    idler,
    pump,
    crystal_setup,
    pp : None,
    fiber_coupling : false,
    pump_bandwidth : 0.01 * 1e-9 * spdcalc::dim::ucum::M,
    pump_spectrum_threshold: std::f64::EPSILON,
    ..SPD::default()
  };

  // params.crystal_setup.crystal = spdcalc::crystal::Crystal::BiBO_1;
  // params.pp = Some(params.calc_periodic_poling());
  // params.crystal_setup.theta = 0.5515891191131287 * spdcalc::dim::ucum::RAD;
  params.assign_optimum_theta();

  let cfg = spdcalc::plotting::HistogramConfig {
    x_range : (1545.00 * NANO, 1555.00 * NANO),
    y_range : (1545.00 * NANO, 1555.00 * NANO),

    x_count : width,
    y_count : height,
  };

  spdcalc::plotting::plot_jsi(&params, &cfg)
}
