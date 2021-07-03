const fs = require('fs');
  
class Repository {
  
    constructor(filename) {
  
        // The filename where datas are
        // going to store
        if (!filename) {
            throw new Error(
            'Filename is required to create a datastore!')
        }
  
        this.filename = filename
  
        try {
            fs.accessSync(this.filename)
        } catch (err) {
  
            // If file not exist it is created
            // with empty array
            fs.writeFileSync(this.filename, '[]')
        }
    }
  
    // Method to fetch all records
    async getAllRecords() {
        return JSON.parse(
            await fs.promises.readFile(this.filename, {
                encoding: 'utf8'
            })
        )
    }
  
    async create(attrs) {
        const records = await this.getAllRecords();
        const record = {
            ...attrs
        }
        records.push(record) 
        // Write all records to the database
        await fs.promises.writeFile(
            this.filename,
            JSON.stringify(records, null, 2)
        );
        return record
    }
}
  
module.exports = new Repository('datastore.json')