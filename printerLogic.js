const { exec } = require('child_process');

/**
 * This method will return an array of possible printers in micron x,y objects
 * @param {string} printerName Name of the printer
 * @returns {Promise<Array<{width: number, height: Number} | string>>}
 */
function getPrinterSize(printerName) {
    return new Promise((resolve, reject) => {
        if (process.platform === "darwin" || process.platform === "linux") {
            // macOS command to list paper sizes
            exec(
                `lpoptions -p "${printerName}" -l | grep PageSize`,
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        const paperSizes = stdout
                            .replace("PageSize/Media Size: *", "")
                            .replace(' Custom.WIDTHxHEIGHT')
                            .replaceAll('mm', '')
                            .split(' ')
                            .map((size) => { 
                                const [x, y] = size.split('x');
                                
                                if(isNaN(x) || isNaN(y)) {
                                    // if size name is one of the follwing string names, A0, A1, A2, A3, A4, A5, A6, Legal, Letter, Tabloid
                                    if(
                                        size === 'A0' || 
                                        size === 'A1' || 
                                        size === 'A2' || 
                                        size === 'A3' || 
                                        size === 'A4' || 
                                        size === 'A5' || 
                                        size === 'A6' || 
                                        size === 'Legal' || 
                                        size === 'Letter' || 
                                        size === 'Tabloid'
                                    )
                                        return size;
                                    
                                    else return;
                                }

                                return { width: parseInt(x*1000), height: parseInt(y*1000) };
                            })

                        resolve(paperSizes.filter((size) => size));
                    }
                }
            );
        } else if (process.platform === "win32") {
            // Windows command to list paper sizes
            exec(
                `wmic printer where "Name='${printerName}'" get PrinterPaperNames /value`,
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        const paperSizes = stdout
                            .trim()
                            .split("=")[1]
                            .split(",")
                            .map((size) => size.trim());
                        resolve(paperSizes);
                    }
                }
            );
        } else {
            reject(new Error(`Unsupported platform: ${process.platform}`));
        }
    });
}

module.exports = { 
    getPrinterSize: getPrinterSize,
};
