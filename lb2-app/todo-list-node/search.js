const axios = require('axios');
const querystring = require('querystring');
const { toInt } = require('./fw/security');

async function getHtml(req) {
    if (req.body.provider === undefined || req.body.terms === undefined){
        return "Not enough information provided";
    }

    // allow only known provider to prevent SSRF/open redirect style abuse
    const provider = req.body.provider === '/search/v2/' ? '/search/v2/' : null;
    if (!provider) return 'Invalid provider';

    let terms = String(req.body.terms);
    if (!terms || terms.length > 50) return 'Invalid search term';

    // never trust user-supplied userid
    const userid = req.session.user.id;

    await sleep(1000); // this is a long, long search!!

    let theUrl='http://localhost:3000'+provider+'?userid='+encodeURIComponent(userid)+'&terms='+encodeURIComponent(terms);
    let result = await callAPI('GET', theUrl, false);
    return result;
}

async function callAPI(method, url, data){
    let noResults = 'No results found!';
    let result;

    switch (method){
        case "POST":
            if (data) {
                result = await axios.post(url, data)
                    .then(response => {
                        return response.data;
                    })
                    .catch(error => {
                        return noResults;
                    });
            } else {
                result = await axios.post(url)
                    .then(response => {
                        return response.data;
                    })
                    .catch(error => {
                        return noResults;
                    });
            }
            break;
        case "PUT":
            if (data) {
                result = await axios.put(url, data)
                    .then(response => {
                        return response.data;
                    })
                    .catch(error => {
                        return noResults;
                    });
            } else {
                result = await axios.put(url)
                    .then(response => {
                        return response.data;
                    })
                    .catch(error => {
                        return noResults;
                    });
            }
            break;
        default:
            if (data)
                url = url+'?'+querystring.stringify(data);

            result = await axios.get(url)
                .then(response => {
                    return response.data;
                })
                .catch(error => {
                    return noResults;
                });
    }

    return result ? result : noResults;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = { html: getHtml };