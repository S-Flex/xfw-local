const { exec } = require('child_process');

/**
 * This method will return an array of possible printers in micron x,y objects
 * @param {string} printerName Name of the printer
 * @returns {Promise<Array<{width: number, height: Number} | string>>}
 */
function getPrinterSize(printerName) {
    // Prevent string escapes with the printername
    printerName = printerName.replaceAll('\\', '\\\\');

    return new Promise((resolve, reject) => {
        if (process.platform === "darwin" || process.platform === "linux") {
            // macOS and linux command to list paper sizes
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
                                    if(filterSupportedSizes(size))
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
                            .split("={")[1]
                            .replace('}', '')
                            .replaceAll('"', '')
                            .replaceAll('mm', '')
                            .split(",")
                            .map((size) => size.trim())
                            .map((size) => {
                                const [x, y] = size.split(' x ');

                                if(isNaN(x) || isNaN(y))
                                    if(filterSupportedSizes(size))
                                        return size;
                                    else 
                                        return;
                                else 
                                    return { width: x*1000, height: y*1000 };
                            })
                            .filter((size) => size);

                        resolve(paperSizes);
                    }
                }
            );
        } else {
            reject(new Error(`Unsupported platform: ${process.platform}`));
        }
    });
}

function filterSupportedSizes(size) {
    return  size === 'A0' || 
            size === 'A1' || 
            size === 'A2' || 
            size === 'A3' || 
            size === 'A4' || 
            size === 'A5' || 
            size === 'A6' || 
            size === 'Legal' || 
            size === 'Letter' || 
            size === 'Tabloid';
}

module.exports = { 
    getPrinterSize: getPrinterSize,
};
