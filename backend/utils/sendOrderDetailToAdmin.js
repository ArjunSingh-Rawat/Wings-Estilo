const { client } = require("./sendAndVerifyOtp");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

async function sendOrderDetailsToAdminViaWhatsapp(orderDetails, sellOrRent) {
  try {
    const { user, shippingAddress, items, createdAt, _id } = orderDetails;
    const userName = user.firstName + " " + user.lastName;
    const { email, phoneNumber } = user;
    const orderDate = new Date(createdAt).toLocaleDateString();

    const { name, addressLine1, addressLine2, district, state, pinCode } =
      shippingAddress;
    const address = `"${name} _${shippingAddress.phoneNumber}_\n${addressLine1} ${addressLine2} ${district} ${state} *${pinCode}*"`;

    let itemString = "";
    for (let i = 0; i < items.length; i++) {
      const { name, _id } = items[i].product;
      let price = 0;
      sellOrRent === "sell"
        ? (price = items[i].product.sellPrice)
        : (price = items[i].product.rentPrice);

      itemString += `${
        i + 1
      }) Name: _${name.trim()}_\n   Price: ${price}\n   Quantity: ${
        items[i].quantity
      }\n   Selected Size: _${
        items[i].productSize
      }_\n*Product Id*: ${_id}\nhttps://wingsestilo.in/${sellOrRent}/${name
        .split(" ")
        .join("-")}/${_id}/buy\n\n`;
    }

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.ADMIN_WHATSAPP_NUMBER}`,
      body:
        `*Got new ${sellOrRent} order*                          *${orderDate}*\n\n` +
        `Order Id: *${_id}*\n\n` +
        `*User Details*:\n` +
        `Name: ${userName}\n` +
        `Email: ${email}\n` +
        `Phone No.: ${phoneNumber}\n\n` +
        `*Shipping Address*:\n` +
        `${address}\n\n` +
        `*Items*:\n` +
        `${itemString}`,
    });
  } catch (error) {
    console.log("this is error from twilio whatsapp", error);
    throw error;
  }
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_AUTH_USER,
    pass: process.env.NODEMAILER_AUTH_PASS,
  },
});

async function sendOrderDetailsToAdminViaEmail(orderDetails, sellOrRent) {
  sellOrRent = sellOrRent[0].toUpperCase() + sellOrRent.slice(1);
  const orderConfirmationFile = fs.readFileSync(
    path.join(__dirname, "../emailTemplates/orderConfirmationAdmin.ejs"),
    "utf-8"
  );
  const { user, shippingAddress, items, createdAt, _id } = orderDetails;
  const { name, addressLine1, addressLine2, district, state, pinCode } =
    shippingAddress;
  const address = `"${name} ${shippingAddress.phoneNumber}, ${addressLine1} ${addressLine2}, ${district}, ${state}, ${pinCode}"`;

  for (const item of items) {
    item.product.image =
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload` +
      item.product.image;
  }

  const emailTemplate = ejs.render(orderConfirmationFile, {
    userName: user.firstName + " " + user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    address,
    sellOrRent,
    orderDate: new Date(createdAt).toLocaleDateString(),
    _id,
    items,
  });
  await sendMailViaNodemailer(emailTemplate);
}

async function sendMailViaNodemailer(emailTemplate) {
  await transporter.sendMail({
    from: process.env.WINGS_ESTILO_MAIL_ID,
    to: process.env.ADMIN_MAIL_ID,
    subject: "Order Received",
    html: emailTemplate,
  });
}

module.exports = {
  sendOrderDetailsToAdminViaWhatsapp,
  sendOrderDetailsToAdminViaEmail,
};
