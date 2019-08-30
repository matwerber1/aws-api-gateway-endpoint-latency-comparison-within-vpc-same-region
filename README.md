# aws-api-gateway-endpoint-latency-comparison-within-vpc-same-region

## Purpose

Measure impact, if any, that the type of deployed Amazon API Gateway has on measured client-side (i.e. mostly network) latency when calling the API from EC2 within the same AWS region. 

## Test Procedure

1. Create a Private API Gateway with a mock integration in a given region. The mock integration removes unwanted noise that a Lambda or other integration endpoint would introduce. 

2. Clone the API into a regional API

3. Clone the API into an edge optimized API

4. Repeatedly call each API from a Cloud9 EC2 instance in the same region and publish the round trip time (RTT) latency, as measured client-side on the EC2, as a custom CloudWatch metric. 

5. Compare the results

## Disclaimer

This is a quick and dirty test, meant more for curiosity rather than any formal benchmark. It was only run on one region for a short time.  

## Results

<Pending>
