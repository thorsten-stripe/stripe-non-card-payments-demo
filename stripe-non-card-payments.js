var STRIPE_PK = 'pk_test_IR0lZ3Ot5IQnsde6xuAmkHvB';
var tonicURL = "https://runkit.io/thor-stripe/stripe-sources-best-practice/branches/master/sources/";

// Create SEPA source: https://stripe.com/docs/sepa-direct-debit
function initiateSepaDebit() {
  console.log("SEPA DEBIT");
  console.log($("#IBAN").val());
  // Initialize Stripe with your publishable key
  Stripe.setPublishableKey(STRIPE_PK);
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
    }
  }
  // Create redirect source
  $.ajax({
    url: tonicURL,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(sourceData[sourceType])
  }).then(function(response){
    console.log(response);
    // Redirect if flow requires
    if (response.flow == 'redirect') {
      window.location.replace(response.redirect.url);
    } else if (response.status == 'chargeable') {
      // This means the source was automatically charged on our webhook.
      // For demo purposes the webhook handler is writing the charge status to the source metadata
      // In your application you should write the charge status to your databse instead
      setTimeout(checkChargeStatus, 1500, response);
    }
  });
}

// Execute this when DOM is loaded
$(document).ready(function() {
  // Open collapse
  var anchor = window.location.hash.replace("#", "");
  if (anchor) {
    $("#collapseSepa").collapse('hide');
    $("#" + anchor).collapse('show');
  }

  // Check if customer is returning from payment provider
  Stripe.setPublishableKey(STRIPE_PK);
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

        } else if (result.metadata.charge_status) {
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
