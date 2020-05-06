const express = require("express");
const app = express();
const bodyParser = require('body-parser');

// This is your real test secret API key. Use your own...
const stripe = require("stripe")("xxxxxxxxxxxxxxxxxxx");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // allow all just for demo there
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

// We will use a customerId that already exist in database
const customerId = 'cus_Gr3Z5geRWKBQ7m';

/*
  * The function below attach a payment method to customer.
  * @returns Return the new attached payment method
  * @params id The payment method id created on front end
 */
app.post('/attachpayment', async (req, res) => {
  const attachedPaymentMethod = await stripe.paymentMethods.attach(req.body.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: req.body.id,
    },
  });
  res.send(attachedPaymentMethod);
});

/*
  * The function below return a subscription
  * @returns Return the new subscription created
  * @params subscriptionId the subscription id that we want to retrieve
 */
app.get('/subscription/:subscriptionId', async (req, res) => {
  const subscription = await stripe.subscriptions.retrieve(req.params.subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });
  res.send(subscription);
});

/*
  * The function below create a subscription for the customer.
  * monthly is a plan id that we have in stripe
  * @returns Return the new subscription created
 */
app.post('/subscription', async (req, res) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ plan: 'monthly' }],
    expand: ["latest_invoice.payment_intent"], // really important to get info on SCA need or not
    payment_behavior: 'allow_incomplete', // really important because if sca is needed, subcription creation will failed
  });
  res.send(subscription);
});

app.listen(4242, () => console.log('Node server listening on port 4242!'));
