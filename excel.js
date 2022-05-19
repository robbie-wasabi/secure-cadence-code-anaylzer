const fs = require("fs")
const excel = require("node-excel-export")

function readCdcFiles(dir) {
    return fs.readdirSync(dir).map(n => {
        return { location: n, code: fs.readFileSync(dir + n, "ascii") }
    })
}

function readDirs(dirs) {
    return dirs.map(dir => {
        return readCdcFiles(`${dir}/`)
    })
}

(async function () {
    // const dirs = ["contract", "transaction", "script"]
    const dirs = ["contract"]
    const datasets = readDirs(dirs)

    //Here you specify the export structure
    const specification = {
        location: {
            displayName: 'location',
        },
        code: {
            displayName: 'code',
        },
    }

    // map data sets to a 1d array
    const data = []
    datasets.forEach(group => {
        group.forEach(d => {
            data.push(d)
        })
    })

    const report = excel.buildExport(
        [
            {
                merges: [],
                specification: specification,
                data: data
            }
        ]
    )

    fs.writeFileSync("./output/output.xls", report, "ascii", (res) => {
        console.log(res)
    })

    exec('cadence-analyzer -csv ./output/output.xls', (err, stdout, stderr) => {
        if (err) {
            //some err occurred
            console.error(err)
        } else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`)
            console.log(`stderr: ${stderr}`)
        }
    })
})()

