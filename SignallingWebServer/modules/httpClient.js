// Copyright Epic Games, Inc. All Rights Reserved.
var querystring = require('querystring')
const http = require('http');
const assert = require('assert');

function cleanUrl(aUrl){
	let url = aUrl;
	if(url.startsWith("http://"))
		url = url.substring("http://".length);
	if(url.endsWith("/"))
		url = url.slice(0,-1)
	
	return url
}

// function extractPort(Url){
// 	let urlVec = Url.split(':', 2)
// 	if (urlVec.length >= 2)
// 		return Number(urlVec[1])
// 	return 80
// }

function createOptions(requestType, url){
	let index = url.indexOf('/');
	let host = (index === -1) ? url.substring(0) : url.substring(0, index)
	let urlVec = host.split(':', 2)
	
	return {
		hostname: urlVec[0],
		port: urlVec[1] ? Number(urlVec[1]) : 80,
		path: (index === -1) ? '' : url.substring(index),
		method: requestType,
		timeout: 30000,
	};
}

function makeHttpsCall(options, aCallback, aError){
	//console.log(JSON.stringify(options));
	const req = http.request(options, function(response){
		let data = '';
		
		//console.log('statusCode:', response.statusCode);
		//console.log('headers:', response.headers);
		
		// A chunk of data has been received.
		response.on('data', (chunk) => {
			data += chunk;
		});
		
		// The whole response has been received. Print out the result.
		response.on('end', () => {
			if(typeof aCallback != "undefined")
				aCallback(response, data);
		});
	});
	
	req.on('timeout', function () {
		console.log("Request timed out. " + (options.timeout / 1000) + " seconds expired");

		// Source: https://github.com/nodejs/node/blob/master/test/parallel/test-http-client-timeout-option.js#L27
		req.destroy();
	});
	
	req.on("error", (err) => {
		if(typeof aError != "undefined") {
			aError(err);
		} else {
			console.log("Error: " + err.message);
		}
	});
	
	return req;
}

module.exports = class HttpClient {
    get(aUrl, aCallback, aError) {
		let url = cleanUrl(aUrl);
		
		let options = createOptions('GET', url);
		
		const req = makeHttpsCall(options, aCallback, aError);
		
		req.end();
    }
	
	post(aUrl, body, aCallback, aError) {
		let url = cleanUrl(aUrl);
		
		let options = createOptions('POST', url);
		
		let postBody = querystring.stringify(body);
		
		//Add extra options for POST request type
		options.headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postBody.length
			};
		
		const req = makeHttpsCall(options, aCallback, aError);
		
		req.write(postBody);
		req.end();
    }
}