use wasm_bindgen::prelude::*;
extern crate spdcalc;

use spdcalc::{
  dim::{
    f64prefixes::{MICRO, NANO},
    ucum::{DEG, M},
  },
  photon::Photon,
  spd::SPD,
};

#[derive(Deserialize)]
pub struct SPDConfig {
  pub crystal : String,
  pub signal_wavelength : f64,
  pub signal_bandwidth : f64,
}

#[derive(Deserialize)]
pub struct JSIConfig {
  // nanometers
  pub ls_min : f64,
  pub ls_max : f64,
  pub li_min : f64,
  pub li_max : f64,

  // dimension of histogram
  pub size : usize,
}

#[wasm_bindgen]
pub fn get_jsi_data( spd_config_raw : &JsValue, jsi_config_raw :&JsValue ) -> Vec<f64> {
  let spd_config : SPDConfig = spd_config_raw.into_serde().unwrap();
  let jsi_config : JSIConfig = jsi_config_raw.into_serde().unwrap();

  let crystal_setup = spdcalc::crystal::CrystalSetup {
    crystal :     spdcalc::crystal::Crystal::BBO_1,
    pm_type :     spdcalc::crystal::PMType::Type1_e_oo,
    theta :       90. * DEG,
    phi :         0. * DEG,
    length :      2_000.0 * MICRO * M,
    temperature : spdcalc::utils::from_celsius_to_kelvin(20.0),
  };

  let waist = spdcalc::WaistSize::new(spdcalc::na::Vector2::new(100.0 * MICRO, 100.0 * MICRO));
  let signal = Photon::signal(0. * DEG, 0. * DEG, spd_config.signal_wavelength * NANO * M, waist);
  let idler = Photon::idler(180. * DEG, 0. * DEG, 1550. * NANO * M, waist);
  let pump = Photon::pump(775. * NANO * M, waist);

  let mut params = SPD {
    signal,
    idler,
    pump,
    crystal_setup,
    pp : None,
    fiber_coupling : false,
    pump_bandwidth : spd_config.signal_bandwidth * 1e-9 * spdcalc::dim::ucum::M,
    pump_spectrum_threshold: std::f64::EPSILON,
    ..SPD::default()
  };

  // params.crystal_setup.crystal = spdcalc::crystal::Crystal::BiBO_1;
  // params.pp = Some(params.calc_periodic_poling());
  // params.crystal_setup.theta = 0.5515891191131287 * spdcalc::dim::ucum::RAD;
  params.assign_optimum_theta();

  let cfg = spdcalc::plotting::HistogramConfig {
    x_range : (jsi_config.ls_min * NANO, jsi_config.ls_max * NANO),
    y_range : (jsi_config.li_min * NANO, jsi_config.li_max * NANO),

    x_count : jsi_config.size,
    y_count : jsi_config.size,
  };

  spdcalc::plotting::plot_jsi(&params, &cfg)
}
