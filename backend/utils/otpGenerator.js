function otpGenerator() {
  let otp = "";

  for (let i = 0; i < 6; i++) {
    otp += Math.round(Math.random() * 9);
  }

  return otp;
}

module.exports = otpGenerator;
