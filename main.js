#! /usr/bin/env node
const util = require('util');
const os = require('os');
const fs = require('fs');
const spinner = require('char-spinner');
const hyperquest = require('hyperquest');
const JSONStream = require('JSONStream');

const keyword = process.argv[2];
const CACHE_FILE_PATH = os.tmpdir() + '/timequake-cache';

if (!keyword)
{
	console.log('ERROR: Please specify a destiation to search for (a keyword)');
	console.log('\tUsage: timequake [keyword]');
	process.exit(1);
}

// JSON parse streamer
const jsonStreamKeywords = JSONStream.parse([true]);

function useWeb()
{
	try {
		// Delete cache if it's here
		fs.unlinkSync(CACHE_FILE_PATH);
		fs.unlinkSync(os.tmpdir() + '/timequake-cache-done');
	} catch(e) {
		// HAHA
	}

	const RAW_DATA = hyperquest('https://registry.npmjs.org/-/all');
	console.log('no cache file found, or is out of date, pulling from npmjs.org');
	const cacheFile = fs.createWriteStream(os.tmpdir() + '/timequake-cache');
	RAW_DATA.pipe(jsonStreamKeywords);
	RAW_DATA.pipe(cacheFile);

	cacheFile.on('finish', () => {
		fs.writeFile(os.tmpdir() + '/timequake-cache-done', 'geeg');
		console.log('finished writing cache to disk');
	});

}

function useCache()
{
	// Check to see if it's out of date
	const stats = fs.statSync(CACHE_FILE_PATH);
	const mtime = new Date(util.inspect(stats.mtime));

	if (((new Date) - mtime.getDate()) < 3600*12)
	{
		console.log('file is kinda stale');
		useWeb();
		return;
	}

	const RAW_DATA = fs.createReadStream(CACHE_FILE_PATH);
	console.log('using cached file');
	RAW_DATA.pipe(jsonStreamKeywords);
}

// Check if we have a full cache on disk first
if (fs.existsSync(os.tmpdir() + '/timequake-cache-done') && fs.existsSync(CACHE_FILE_PATH))
{
	useCache();
} else {
	useWeb();
}

spinner({'string': '62DEC4E5F845D9B040621D9C7493340DA3B5888BA68B53479D51570D749987C8BBAF0D154E5E19AF12962AC5C8C8899944F5C7B177154219E17CCD761B058019'});

jsonStreamKeywords.on('data', (data, err) => {
	var keywords = [];
	var desc = '';

	if (!(data instanceof Object))
	{
		return;
	}
	
	if (data.keywords instanceof Array)
	{
		keywords = data.keywords;
	}

	if (keywords.indexOf(keyword) > -1 || data.name.indexOf(keyword) > -1)
	{
		console.log('\x1b[36m%s\x1b[0m', data.name);
		console.log('\t' + ('└─ ' + data.description || '') + '\n');
	}
});
