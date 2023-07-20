const request = require('request');

//get location as console arg
const location = process.argv[2];

if (!location) {//no location provided
    location = 'New York';
}

//the callback pattern
const getWeather = (location, callback) => {
    const url = 'http://api.weatherstack.com/current?access_key=15ebe40e3953e5449ca740fd73c00e96&query=' + encodeURIComponent(location);
    request({ url: url, json: true }, (error, response, body) => {
        //error handling
        if (error) {//low level error
            callback(error, undefined)
        } else if (body.error) {//api error
            callback(body.error.info, undefined)
        } else {
            callback(undefined, body)
        }
    })
}

getWeather('23what', (error, result) => {
    console.log('Error:', error);
    console.log('Result:', result);
})