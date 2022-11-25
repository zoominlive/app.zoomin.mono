const fs = require('fs-extra');
const filePath = './package.json';

async function updateBuildDate() {
  try {
    const packageJson = await fs.readJson(filePath);

    packageJson.buildDate = new Date().getTime();
    await fs.writeJson(filePath, packageJson);

    const jsonData = {
      buildDate: packageJson.buildDate
    };
    await fs.writeJson('./public/meta.json', jsonData);

    console.log('Latest build date and time updated in meta.json file');
  } catch (err) {
    console.error(err);
  }
}

updateBuildDate();
