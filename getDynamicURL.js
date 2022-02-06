const needle = require('needle');
const cheerio = require('cheerio');


const URL = 'https://handlowa.eu/dla-studenta/organizacja-roku-akademickiego/informatyka/';
 
 function getURLToFile(){
    return new Promise( (resolve ,reject) => {
        needle.get(URL, function(err, res){
         if (err) reject(err);
         resolve(res.body)
    })
});
 
}

get().then( (data) => {
    const $ = cheerio.load(data);
    let res = $('.red-table-header a');
    const firtYear = res["0"]["attribs"]["href"];
    const secondYear = res["1"]["attribs"]["href"];
    const thirdYear = res["2"]["attribs"]["href"];
})