var stripe = Stripe("xxxxxxxxxxxxxxxxxxx");

var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
    fontFamily: 'Arial, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
    "::placeholder": {
      color: "#32325d"
    }
  },
  invalid: {
    fontFamily: 'Arial, sans-serif',
    color: "#fa755a",
    iconColor: "#fa755a"
  }
};
var card = elements.create("card", { style: style });
// Stripe injects an iframe into the DOM
card.mount("#card-element");
card.on("change", function (event) {
  // Disable the Pay button if there are no card details in the Element
  document.querySelector("button").disabled = event.empty;
  document.querySelector("#card-errors").textContent = event.error ? event.error.message : "";
});

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}
var form = document.getElementById("payment-form");
form.addEventListener("submit", async function(event) {
  event.preventDefault();
  setLoading(true);
  // Complete payment when the submit button is clicked
  const paymentMethod = await stripe.createPaymentMethod({ type: 'card', card }); // Create paymentMethod directly on stripe
  console.log(paymentMethod);
  try {
    // Attach payment method to customer
    const paymentAttached = await (await fetch("http://localhost:4242/attachpayment", { method: "POST", headers: {
        "Content-Type": "application/json"
      }, body: JSON.stringify({
            id: paymentMethod.paymentMethod.id,
      })
    })).json();
    console.log('paymentAttached', paymentAttached);
    // Create subscription
    const subscriptionCreated = await (await fetch("http://localhost:4242/subscription", { method: "POST", headers: {
        "Content-Type": "application/json"
      }, body: JSON.stringify({
        id: paymentMethod.paymentMethod.id,
      })
    })).json();
    console.log('subscriptionCreated', subscriptionCreated);
    // If we use a card that need sca (4000002500003155), we need to confirm the payment
    const { latest_invoice } = subscriptionCreated;
    const { payment_intent } = latest_invoice;
    if (payment_intent) {
      const { client_secret, status } = payment_intent;
      if (['requires_source_action', 'requires_payment_method', 'requires_confirmation'].includes(status)) {
        const result = await stripe.confirmCardPayment(client_secret); // confirm payment there -> stripe will display a modal to continue
        if (result.error) {
          setLoading(false); // stop spinner there
          alert(result.error);
          return;
        }
      }
    }
    const subscriptionUpdated = await (await fetch("http://localhost:4242/subscription/".concat(subscriptionCreated.id), { method: "GET", headers: {
        "Content-Type": "application/json"
      }})).json();
    console.log('subscriptionUpdated', subscriptionUpdated);
    setLoading(false); // stop spinner there
    alert('subscription ready');
  } catch (e) {
    setLoading(false); // stop spinner there
    console.log('error', e);
    alert(e.message);
  }
});

