const { client } = require("./sendAndVerifyOtp");

async function sendOrderDetailsToAdmin(orderDetails) {
  try {
    console.log(orderDetails);
    const { user, shippingAddress, items, createdAt, _id } = orderDetails;
    const userName = user.firstName + " " + user.lastName;
    const { email, phoneNumber } = user;
    const orderDate = new Date(createdAt).toLocaleDateString();

    const { name, addressLine1, addressLine2, district, state, pinCode } =
      shippingAddress;
    const address = `"${name} _${shippingAddress.phoneNumber}_\n${addressLine1} ${addressLine2} ${district} ${state} *${pinCode}*"`;

    let itemString = "";
    for (let i = 0; i < items.length; i++) {
      const { name, sellPrice, _id } = items[i].product;
      itemString += `${
        i + 1
      }) Name: _${name.trim()}_\n   Sell Price: ${sellPrice}\n   Quantity: ${
        items[i].quantity
      }\n   Selected Size: _${
        items[i].productSize
      }_\n*Product Id*: ${_id}\nhttps://wingsestilo.in/sell/${name
        .split(" ")
        .join("-")}/${_id}/buy\n\n`;
    }

    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.ADMIN_WHATSAPP_NUMBER}`,
      body:
        `*Got new order*                              *${orderDate}*\n\n` +
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

module.exports = { sendOrderDetailsToAdmin };
