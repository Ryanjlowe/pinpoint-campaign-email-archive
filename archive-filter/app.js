const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});
const promisedHandlebars = require('promised-handlebars');
const Q = require('q');
const Handlebars = promisedHandlebars(require('handlebars'), { Promise: Q.Promise });

const pinpoint = new AWS.Pinpoint();

exports.handler = async (event) => {

  console.log(JSON.stringify(event));

  // Fetch the Pinpoint Campaign
  return pinpoint.getCampaign({
      ApplicationId: event.ApplicationId,
      CampaignId: event.CampaignId
    }).promise()
    .then((response) => {

      // Now Fetch the Template for the Campaign
      const TemplateName = response.CampaignResponse.TemplateConfiguration.EmailTemplate.Name;
      return pinpoint.getEmailTemplate({ TemplateName }).promise();
    })
    .then((response) => {

      // Compile the Handlebars Template
      const compiled = Handlebars.compile(response.EmailTemplateResponse.HtmlPart);

      // Now loop over all of the Endpoints and render the email
      const promises = Object.keys(event.Endpoints).map((endpointId, ind) => {
        const endpoint = event.Endpoints[endpointId];
        // Parse the current endpoint with the handlebars compiled template
        return compiled(endpoint).then((html) => {
          // TODO TODO TODO TODO TODO TODO TODO
          // TODO PERSIST THE HTML SOMEWHERE
          // TODO TODO TODO TODO TODO TODO TODO
          // Will Log to Cloudwatch if nothing else
          console.log('Compiled HTML for Endpoint: ' + endpointId + ' :: ' + html);
        });
      });

      return Promise.all(promises)
        .then((endpoints) => {
          // Return the un-mutated
          return event.Endpoints;
        });

    });
};
