<<<<<<< HEAD
$(document).ready(function() {
  window.location.replace('https://stripe-sources-demo.herokuapp.com/');
});
=======
var TEST_PK = 'pk_test_IR0lZ3Ot5IQnsde6xuAmkHvB';
var LIVE_PK = 'pk_live_rsos9KggpkJEaMgJ4zkBvMeL';
var KLARNA_TEST_PK = 'pk_test_a0BdO7vL5WSJLbEKI8r7T3pg';
var KLARNA_LIVE_PK = 'pk_live_tcRYYRYFzgzVKMkTfmfMHzby';
var tonicURL = "https://runkit.io/thor-stripe/stripe-sources-best-practice/branches/master/sources/";

// Create SEPA source: https://stripe.com/docs/sepa-direct-debit
function initiateSepaDebit() {
  console.log("SEPA DEBIT");
  console.log($("#IBAN").val());
  // Initialize Stripe with your publishable key
  var STRIPE_PK = (window.location.search.indexOf('?live') != -1) ? LIVE_PK : TEST_PK;
  Stripe.setPublishableKey(STRIPE_PK);
  console.log(Stripe.key);
  // Create bank account token: __
  Stripe.bankAccount.createToken({
    account_number: $("#IBAN").val(),
    currency: "eur", // can only be EUR
    usage: "source", // important
    account_holder_name: $("#owner_name").val(),
    address_line1: $("#address_line1").val(),
    address_city: $("#city").val(),
    address_zip: $("#zip").val(),
  }, function(status, token) {
    if (staus = 200) {
      // Create SEPA Source on server
      createSource('sepa', token.id);
    } else {
      // error creating bank account token
    }
  });
}

// Create redirect source: ____
function createSource(sourceType) {
  console.log(sourceType);
  toggleResult();
  // Data required to create sources
  var sourceData = {
    sofort: {
      type: "sofort",
      amount: $("#amount").val(),
      owner: { name: $("#owner_name").val() },
      sofort: { country: $("#sofort_country").val() }
    },
    giropay: {
      type: "giropay",
      amount: $("#amount").val(),
      owner: { name: $("#owner_name").val() }
    },
    ideal: {
      type: "ideal",
      amount: $("#amount").val(),
      owner: { name: $("#owner_name").val() }
    },
    bancontact: {
      type: "bancontact",
      amount: $("#amount").val(),
      owner: { name: $("#owner_name").val() }
    },
    sepa: {
      type: "sepa_debit",
      amount: $("#amount").val(),
      token: arguments[1]
    },
    klarna: {
      type: 'klarna',
      amount: 816,
      currency: 'usd', // currently only USD or GBP
      klarna: {
        first_name: 'Jenny',
        last_name: 'Rosen',
      },
      owner: {
        email: 'jenny.rosen@example.com',
        address: {
          line1: '1234 Main Street',
          city: 'San Francisco',
          postal_code: '94115',
          country: 'US',
          state: 'CA',
        },
        phone: '4152165700',
      },
      order: {
        items: [{
          type: 'sku',
          description: 'Grey cotton T-shirt',
          quantity: 2,
          currency: 'usd',
          amount: 796,
       }, {
          type: 'tax',
          description: 'Taxes',
          currency: 'usd',
          amount: 20,
       }, {
          type: 'shipping',
          description: 'Free Shipping',
          currency: 'usd',
          amount: 0,
       }],
        shipping: {
          name: 'Jenny Rosen',
          address: {
            line1: '1234 Main Street',
            city: 'San Francisco',
            postal_code: '94115',
            country: 'US',
            state: 'CA',
          },
        },
      },
    },
  }
  // Create redirect source // Klarna only allows USD or GBP atm
  sourceData[sourceType].currency = (sourceType === 'klarna') ? 'usd' : 'eur';
  sourceData[sourceType].redirect = {
    return_url: window.location.href
  };
  // TODO refactor to return promise that resolves with a source instead of taking action
  Stripe.source.create(sourceData[sourceType], function(status, response){
    console.log(status,response);
    // Redirect if flow requires
    if (response.flow == 'redirect') {
      window.location.replace(response.redirect.url);
    } else if (response.status == 'chargeable') {
      // This means the source was automatically charged on our webhook.
      // For demo purposes the webhook handler is writing the charge status to the source metadata
      // In your application you should write the charge status to your databse instead
      setTimeout(checkChargeStatus, 1500, response);
    } else if (response.type === 'klarna') {
      initKlarna(response);
    }
  });

  // $.ajax({
  //   url: tonicURL,
  //   type: "POST",
  //   contentType: "application/json; charset=utf-8",
  //   data: JSON.stringify(sourceData[sourceType])
  // }).then(function(response){
  //   console.log(response);
  //   // Redirect if flow requires
  //   if (response.flow == 'redirect') {
  //     window.location.replace(response.redirect.url);
  //   } else if (response.status == 'chargeable') {
  //     // This means the source was automatically charged on our webhook.
  //     // For demo purposes the webhook handler is writing the charge status to the source metadata
  //     // In your application you should write the charge status to your databse instead
  //     setTimeout(checkChargeStatus, 1500, response);
  //   }
  // });
}

// Execute this when DOM is loaded
$(document).ready(function() {
  // Open collapse
  var anchor = window.location.hash.replace("#", "");
  if (anchor) {
    $("#collapseSepa").collapse('hide');
    $("#" + anchor).collapse('show');
  }

  var STRIPE_PK = (window.location.search.indexOf('?live') != -1) ? LIVE_PK : TEST_PK;
  // Check if customer is returning from payment provider
  Stripe.setPublishableKey(STRIPE_PK);
  console.log(Stripe.key);
  // TODO Enable Stripe elements
  //var elements = stripe.elements();
  // Construct the Stripe Element:
  //var card = elements.create('card');
  // Initialize the Element into our HTML `span` element, with id="card":
  //card.mount('#card');

  // Get source params after redirect
  var sourceId = getParams('source');
  var sourceClientSecret = getParams('client_secret');

  if (sourceId) {
    toggleResult();
    // Poll the source to see if the funds have been successfully collected
    Stripe.source.poll(
      sourceId,
      sourceClientSecret,
      function(status, source) {
        console.log(source.metadata.charge_status);
        // Check is source has been consumed
        if (source.status == 'consumed') {
          console.log(source);
          $("#result").html(
            "Successfully collected "
            +(source.amount/100)
            +source.currency.toUpperCase()
            +" from "
            +source.owner.verified_name
            +"'s "+ ((source.type == 'ideal') ? source[source.type].bank : source[source.type].bank_name) // TODO naming?
            +" account using "
            +source.type+"."
          );
          toggleResult();

          Stripe.source.cancelPoll(sourceId);
        } else if (source.status == 'failed') {
          // TODO show failed message and prompt to retry
        }
    });
  }
});

// Helpers
// Check Charge status
function checkChargeStatus(response) {
  Stripe.request({
    url: Stripe.endpoint + "/sources/"+ response.id,
    data: {
      key:Stripe.key,
      client_secret: response.client_secret
    },
    method: 'GET',
    headers: {},
    success: function(result, status) {
        if (status != 200) {
          // TODO show error message

        } else if (!!result.metadata.charge_status) {
          var chargeStatus = result.metadata.charge_status;
          // Charge has been made update UI
          $("#result").html(
            "Successfully created a "+ chargeStatus +" charge "
            //+ createDashboardLink(response.object, response.livemode, response.id)
            //+" for customer "
            //+ createDashboardLink('customer', response.livemode, response.customer)
            +'. View your SEPA mandate <a href="'+result.sepa_debit.mandate_url+'" target="_blank">here</a>.'
          );
          toggleResult();
      } else {
        setTimeout(checkChargeStatus, 1500, response);
      }
    }
  })
}

// Assemble link to Stripe Dashboard
function createDashboardLink(objectType, livemode, id) {
  var dashboardURL = 'https://dashboard.stripe.com/';
  dashboardURL += (livemode ? '' : 'test/');

  var html = '<a href="'+dashboardURL;

  switch (objectType) {
    case 'charge':
      html += 'payments/';
      break;
    case 'customer':
      html += 'customers/';
      break;
  }

  html += id+'" target="_blank">'+id+'</a>';
  return html;
}
// read out URL params
function getParams(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace(
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;
	}
	return vars;
}
// Toggle Spinner and Result show
function toggleResult() {
  if ($('.spinner').css('display') == 'none') {
    $('.spinner').show();
    $('.bg-success').hide();
  } else {
    $('.spinner').hide();
    $('.bg-success').show();
  }
}

// Testing Klarna
window.klarnaAsyncCallback = function () {
  console.log(Klarna);
  $('#accordion').on('show.bs.collapse', function (e) {
    if (e.target.id === 'collapseKlarna') {
      // set Klarna keys
      var STRIPE_PK = (window.location.search.indexOf('?live') != -1) ? KLARNA_LIVE_PK : KLARNA_TEST_PK;
      Stripe.setPublishableKey(STRIPE_PK);
      console.log(Stripe.key);
      // Only init Klarna if it's not initialised
      if (!Klarna.Credit.initialized) {
        console.log('create Klarna source');
        // create Klarna source
        createSource('klarna');
      }
    } else {
      var STRIPE_PK = (window.location.search.indexOf('?live') != -1) ? LIVE_PK : TEST_PK;
      Stripe.setPublishableKey(STRIPE_PK);
      console.log(Stripe.key);
    }
  });
};

function initKlarna(source) {
  Klarna.Credit.init({
    client_token: source.klarna.client_token,
  });

  Klarna.Credit.load({
    container: '#klarna_container'
  }, function(res) {
    console.log(res);
    toggleResult();
  });
}

// TODO submit Klarna order
function submitKlarnaOrder() {
  toggleResult();
  Klarna.Credit.authorize({}, function(res){
    console.debug('Klarna.Credit.authorize', res);
    if (res.approved) {
      $("#result").html(
        'Your order has been approved by Klarna, yay!'
      );
      toggleResult();
      // TODO charge in webhook handler
      // TODO poll for consumed status
    } else {
      // TODO Klarna error / unapproved message
    }
  });
}
>>>>>>> origin/gh-pages
