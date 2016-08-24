var STRIPE_PK = 'pk_test_IR0lZ3Ot5IQnsde6xuAmkHvB';
var tonicURL = "https://tonicdev.io/thor-stripe/stripe-non-card-payments-demo/branches/master/sources/";

// Create SEPA source: ___
function initiateSepaDebit() {
  console.log("SEPA DEBIT");
  console.log($("#IBAN").val());
  toggleResult();
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
    $.post(
        tonicURL,
        {
          type: "sepa_debit",
          amount: $("#amount").val(),
          btok: token.id
        },
        function(response) {
          console.log(response);
          $("#result").html(
            "Successfully created charge "
            + createDashboardLink(response.object, response.livemode, response.id)
            +" for customer "
            + createDashboardLink('customer', response.livemode, response.customer)
            +'. View your SEPA mandate <a href="'+response.source.sepa_debit.mandate_url+'" target="_blank">here</a>.'
          );
          toggleResult();
        }
);
  } else {
    // error creating bank account token
  }
});
}

// Create SOFORT source: ____
function initiateSofort() {
  console.log("SOFORT");
  console.log($("#sofort_country").val());
  toggleResult();
  // Create SOFORT source
  $.post(
        tonicURL,
        {
          type: "sofort",
          amount: $("#amount").val(),
          owner_name: $("#owner_name").val(),
          sofort_country: $("#sofort_country").val()
        },
        function(response) {
          console.log(response);
          // Redirect to SOFORT
          window.location.replace(response.redirect.url);
        }
);
}

// Create iDeal source: ____
function initiateIdeal() {
  console.log("iDEAL");
}

// Create Bancontact source: ____
function initiateBancontact() {
  console.log("Bancontact");
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
  if (sourceId) {
    toggleResult();
    $.get(tonicURL+sourceId,
      function(res){
        console.log(res);
        // Poll the source to see if the funds have been successfully collected
        Stripe.source.poll(
          res.id,
          res.client_secret,
          function(status, source) {
            console.log(source.status);
            // Check is source has been consumed
            if (source.status == 'consumed') {
              console.log(source);
              $("#result").html(
                "Successfully collected "
                +(source.amount/100)
                +source.currency.toUpperCase()
                +" from "
                +source.owner.verified_name
                +"'s "+source[source.type].bank_name
                +" account using "
                +source.type+"."
              );
              toggleResult();

              Stripe.source.cancelPoll(res.id);
            } else if (source.status == 'failed') {
              // TODO show failed message and prompt to retry
            }
        });
    });
  }
});

// Helpers
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
