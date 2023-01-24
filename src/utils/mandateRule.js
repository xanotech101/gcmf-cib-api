const minAmt = {

}




// fs.createWriteStream() method 
  
// Include fs module 
let fs = require('fs'), 
  

// to write the file 
let writer = fs.createWriteStream('test_gfg.txt') 
  
// Read and display the file data on console 
writer.write('GeeksforGeeks');


 
// fs.createWriteStream() method 
  
// Include fs module 
let fs = require('fs');
   
let writer = fs.createWriteStream('test_gfg.txt', {
        flags: 'w'
    });
   

// to read the file 
let reader = fs.createReadStream('test_gfg.txt')
         .pipe(writer);
