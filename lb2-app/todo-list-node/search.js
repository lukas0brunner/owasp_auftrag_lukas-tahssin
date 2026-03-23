const searchProvider = require('./search/v2/index');

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

    // Optional demo delay (avoid availability issues in normal runs)
    if (process.env.DEMO_SLOW_SEARCH === '1') {
        await sleep(1000);
    }

    // Avoid HTTP self-call (DoS/SSRF-like pattern). Call provider directly.
    // Provider reads authorization from session anyway.
    return await searchProvider.search({
        ...req,
        query: { userid, terms }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = { html: getHtml };