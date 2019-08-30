const axios = require('axios');
const aws = require('aws-sdk');
const cw = new aws.CloudWatch({region: 'us-east-1'});

const regional_endpoint = "https://<API_ID>.execute-api.<REGION>.amazonaws.com";
const edge_endpoint = "https://<API_ID>.execute-api.<REGION>.amazonaws.com";
const private_endpoint = "https://<VPC_ENDPOINT_ID>.execute-api.<REGION>.vpce.amazonaws.com";
const private_api_id = "<API_ID>";

// assumption is that API stage and resource names are identical between the three APIs:
const api_stage = "test";
const api_resource = "mock";


async function main() {

  var private_rtt, regional_rtt, edge_rtt;

  for (var i = 0; i < 100000; i++) {
    console.log('Loop count: ', i);
    private_rtt = await makeApiCall('Private', private_endpoint, private_api_id);
    regional_rtt = await makeApiCall('Regional', regional_endpoint);
    edge_rtt = await makeApiCall('Edge', edge_endpoint);

    // Since my Lambda API integration is querying Aurora Serverless, the first
    // invocation may take quite a bit due to the initial cold start. I don't
    // want this in my metrics, so let's ignore the first loop iteration.
    if (i > 0) {
      await publishMetrics(private_rtt, regional_rtt, edge_rtt);
    }

  }
}


/* If endpoint is supplied without api_id, assume that it is a public endpoint
 * (regional or edge-optimized). If api_id is supplied, assume it is a private
 * endpoint.
*/
async function makeApiCall(api_type, endpoint, api_id=undefined) {

  var params = {};

  if (api_id) {
    params.headers = { "x-apigw-api-id": private_api_id };
  }

  var api_path = `${endpoint}/${api_stage}/${api_resource}`;

  var startTime = microsecondTime();
  await axios.get(api_path, params);
  var endTime = microsecondTime();
  var elapsedTime = Math.round(endTime - startTime, 3) / 1000;                  // provides time in milliseconds, to three decimals
  console.log(`${api_type} API completed in ${elapsedTime} ms`);
  return elapsedTime;
}


function microsecondTime() {
  var hrTime = process.hrtime();
  return (hrTime[0] * 1000000 + hrTime[1] / 1000);
}


async function publishMetrics(private_rtt, regional_rtt, edge_rtt) {

  var metric_time = new Date();
  const namespace = 'API_GATEWAY_TEST';
  const unit = 'Milliseconds';
  const resolution = 60;
  const metric_name = 'CLIENT_RTT_LATENCY';
  const dimension_name = 'API_TYPE';

    var params = {
      MetricData: [
        {
          MetricName: metric_name,
          Dimensions: [
            {
              Name: dimension_name,
              Value: 'PRIVATE'
            },
          ],
          StorageResolution: resolution,
          Timestamp: metric_time,
          Unit: unit,
          Value: private_rtt,
        },
        {
          MetricName: metric_name,
          Dimensions: [
            {
              Name: dimension_name,
              Value: 'REGIONAL'
            },
          ],
          StorageResolution: resolution,
          Timestamp: metric_time,
          Unit: unit,
          Value: regional_rtt,
        },
        {
          MetricName: metric_name,
          Dimensions: [
            {
              Name: dimension_name,
              Value: 'EDGE'
            },
          ],
          StorageResolution: resolution,
          Timestamp: metric_time,
          Unit: unit,
          Value: edge_rtt,
        }
      ],
      Namespace: namespace
    };

    await cw.putMetricData(params).promise();
    console.log('Metrics published.\n');

}

(async () => {
  try {
    await main();
  }
  catch(err) {
    console.log('Error: ' + err);
  }
})();
