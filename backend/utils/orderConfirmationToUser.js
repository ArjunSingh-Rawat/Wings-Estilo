const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_AUTH_USER,
    pass: process.env.NODEMAILER_AUTH_PASS,
  },
});

async function sendOrderConfirmationToUserViaEmail(orderDetails, sellOrRent) {
  sellOrRent = sellOrRent[0].toUpperCase() + sellOrRent.slice(1);
  const orderConfirmationFile = fs.readFileSync(
    path.join(__dirname, "../emailTemplates/orderConfirmationUser.ejs"),
    "utf-8"
  );
  const { user, items, createdAt, _id, deliveryCharge, totalAmount } =
    orderDetails;

  for (const item of items) {
    item.product.image =
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
      item.product.image;
  }

  const emailTemplate = ejs.render(orderConfirmationFile, {
    sellOrRent,
    orderDate: new Date(createdAt).toLocaleDateString(),
    _id,
    items,
    totalAmount,
    deliveryCharge,
  });
  await sendMailViaNodemailer(emailTemplate, user.email);
}

async function sendMailViaNodemailer(emailTemplate, receiverEmail) {
  await transporter.sendMail({
    from: process.env.WINGS_ESTILO_MAIL_ID,
    to: receiverEmail,
    subject: "Order Placed",
    html: emailTemplate,
  });
}

module.exports = { sendOrderConfirmationToUserViaEmail };
