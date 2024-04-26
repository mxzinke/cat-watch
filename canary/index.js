const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

// Require any dependencies that your script needs
// Bundle additional files and dependencies into a .zip file with folder structure
// nodejs/node_modules/additional files and folders

const takeScreenshot = async () => {
    let page = await synthetics.getPage();
    await page.goto(process.env.SITE_URL, { waitUntil: 'networkidle0' });
    await page.screenshot({path: '/tmp/screenshot.png'});
    let pageTitle = await page.title();
    log.info('Page title: ' + pageTitle);
    return pageTitle;  // Or any other relevant output
};

exports.handler = async () => {
    return await takeScreenshot();
};