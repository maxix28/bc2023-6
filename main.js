const express = require("express");
const multer = require("multer");
const fs = require("fs/promises"); 
const fs1 =require("fs").promises;

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');


const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = 3000;
const path = require('path');
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = 'uploads/';
        try {
            await fs.access(uploadPath);
        } catch (error) {
           
            await fs.mkdir(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
var deviceIdCounter = 1; 

app.set('view engine', 'ejs');


app.set('views', path.join(__dirname, 'views'));

app.use('/uploads', express.static(path.join(__dirname,  'uploads')));

const upload1 = multer({ storage: storage }).single('photo');

const upload = multer();
const notesFilePath = "users.json";
const devicesFilePath = "device.json";
const photoArray = [];
async function checkNotes() {
    try {
     
      await fs.access(notesFilePath);
  
    } catch (error) {
      
      await fs.writeFile(notesFilePath, "[]");
    }
  
  
  app.use(express.json());
  }
  
  
  async function checkdevice() {
      try {
       
        await fs.access(devicesFilePath);
    
      } catch (error) {
        
        await fs.writeFile(devicesFilePath, "[]");
      }
    
    
    app.use(express.json());
    }
    

    app.get('/RegPage', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
     });
    
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'firstPage.html'));
     });
    
    
     app.get('/RegDevice', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'deviceAdd.html'));
     });


    app.post("/User/register", upload.none(), async (req, res) => {
      try {
          await checkNotes();
          console.log(req.body)
  
          const data = await fs.readFile(notesFilePath, "utf-8");
          const users = JSON.parse(data);
  
          const { note_name: noteName, note: noteText } = req.body;
          console.log(noteName);
  
          if (users.some((note) => note.title === noteName)) {
              return res.status(400).send("Have this user");
          }
  
          users.push({ title: noteName, text: noteText });
          await fs.writeFile(notesFilePath, JSON.stringify(users));
  
          res.status(201).end();
      } catch (error) {
          console.error(error);
          res.status(500).send("Internal Server Error");
      }
  });
  

      
async function initDeviceIdCounter() {
  try {
      const counterFilePath = path.join(__dirname, 'deviceCounter.json');
      const counterData = await fs.readFile(counterFilePath, 'utf-8');
      deviceIdCounter = JSON.parse(counterData).counter || 1;
  } catch (error) {
      deviceIdCounter = 1;
  }
}

async function saveDeviceIdCounter() {
  const counterFilePath = path.join(__dirname, 'deviceCounter.json');
  await fs.writeFile(counterFilePath, JSON.stringify({ counter: deviceIdCounter }));
}
/**
 * @swagger
 * /Device/Add:
 *   post:
 *     summary: Add a new device
 *     description: Add a new device with details like device name, description, serial number, manufacturer, and an optional image.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               deviceName:
 *                 type: string
 *               description:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Device added successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Device added successfully
 *               device:
 *                 deviceId: 1
 *                 deviceName: ExampleDevice
 *                 description: Example Description
 *                 serialNumber: ABC123
 *                 manufacturer: Example Manufacturer
 *                 imageUrl: example-image.jpg
 *       500:
 *         description: Internal Server Error
 */
app.post("/Device/Add", upload1, async (req, res) => {
  console.log("Device");
  try {
      await checkdevice();
      console.log("Device1");

      await initDeviceIdCounter();

      const data = await fs.readFile(devicesFilePath, "utf-8");
      const devices = JSON.parse(data);
      console.log("Device2");

      const { deviceName, description, serialNumber, manufacturer } = req.body;
      const imageUrl = req.file ? req.file.filename : '';
      const deviceId = deviceIdCounter++;

      devices.push({
          deviceId,
          deviceName,
          description,
          serialNumber,
          manufacturer,
          imageUrl
      });

      await fs.writeFile(devicesFilePath, JSON.stringify(devices));
      await saveDeviceIdCounter();

      res.status(201).json({ message: "Device added successfully", device: devices[devices.length - 1] });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
      


      app.post("/User/Login", upload.none(), async (req, res) => {
        try {
            await checkNotes();
            const data = await fs.readFile(notesFilePath, "utf-8");
            const users = JSON.parse(data);
            const { note_name: noteName, note: noteText } = req.body;
           
            console.log(req.body)
            const user = users.find((note) => note.title === noteName && note.text === noteText);
    
            if (user) {
                return res.status(200).json({
                    message: "User found",
                    user: user
                });
            } else {
                return res.status(403).json({
                    message: "User not found"
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    });
    


/**
 * @swagger
 * /Device/Delete/{deviceId}:
 *   delete:
 *     summary: Delete a device
 *     description: Delete a device by providing the device ID.
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *         description: ID of the device to delete
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal Server Error
 */

app.delete("/Device/Delete/:deviceId", async (req, res) => {
  const deviceIdToDelete = parseInt(req.params.deviceId);

  try {
      await checkdevice();

      const data = await fs.readFile(devicesFilePath, "utf-8");
      const devices = JSON.parse(data);

      const deviceIndex = devices.findIndex((device) => device.deviceId === deviceIdToDelete);

      if (deviceIndex === -1) {
          return res.status(404).send("Device not found");
      }

      devices.splice(deviceIndex, 1);

      await fs.writeFile(devicesFilePath, JSON.stringify(devices));

      res.status(200).send("Device deleted successfully");
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});
/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Get all devices
 *     description: Retrieve a list of all devices.
 *     responses:
 *       200:
 *         description: List of devices retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               - deviceId: 1
 *                 deviceName: ExampleDevice1
 *                 description: Example Description 1
 *                 serialNumber: ABC123-1
 *                 manufacturer: Example Manufacturer 1
 *                 imageUrl: example-image-1.jpg
 *               - deviceId: 2
 *                 deviceName: ExampleDevice2
 *                 description: Example Description 2
 *                 serialNumber: ABC123-2
 *                 manufacturer: Example Manufacturer 2
 *                 imageUrl: example-image-2.jpg
 *       500:
 *         description: Internal Server Error
 */

app.get("/devices", async (req, res) => {
  try {
      await checkdevice();

      const data = await fs.readFile(devicesFilePath, "utf-8");
      const devices = JSON.parse(data);

      res.status(200).json(devices);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});


     app.listen(PORT, () => {

        console.log(`Server is running on port ${PORT}`);
      
      });
      

app.post("/User/:name/TakeDevice/:deviceId", upload1, async (req, res) => {
    const userName = req.params.name;
    const deviceId = parseInt(req.params.deviceId);

    try {
      
        const userData = await fs.readFile(notesFilePath, "utf-8");
        const users = JSON.parse(userData);
        const user = users.find((u) => u.title === userName);

        if (!user) {
            return res.status(404).send("User not found");
        }

       
        const deviceData = await fs.readFile(devicesFilePath, "utf-8");
        const devices = JSON.parse(deviceData);
        const deviceIndex = devices.findIndex((device) => device.deviceId === deviceId);

        if (deviceIndex === -1) {
            return res.status(404).send("Device not found");
        }

        if (devices[deviceIndex].takenBy) {
            return res.status(400).send("Device is already taken");
        }

      
        devices[deviceIndex].takenBy = userName;
        
       
        await fs.writeFile(devicesFilePath, JSON.stringify(devices));

        res.status(200).send("Device taken successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

 app.put("/Device/Update/:deviceId", upload1, async (req, res) => {
        const deviceIdToUpdate = parseInt(req.params.deviceId);
    
        try {
            await checkdevice();
    
            const data = await fs.readFile(devicesFilePath, "utf-8");
            const devices = JSON.parse(data);
    
            const deviceIndex = devices.findIndex((device) => device.deviceId === deviceIdToUpdate);
    
            if (deviceIndex === -1) {
                return res.status(404).send("Device not found");
            }
    
            const { deviceName, description, serialNumber, manufacturer } = req.body;
            const imageUrl = req.file ? req.file.filename : '';
    
          
            devices[deviceIndex] = {
                ...devices[deviceIndex], 
                deviceName,
                description,
                serialNumber,
                manufacturer,
                ...imageUrl
            };
    
            await fs.writeFile(devicesFilePath, JSON.stringify(devices));
    
            res.status(200).json({ message: "Device updated successfully", device: devices[deviceIndex] });
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    });
    
     
      
    app.post("/User/:name/LeftDevice/:deviceId", async (req, res) => {
        const userName = req.params.name;
        const deviceId = parseInt(req.params.deviceId);
    
        try {
            // Check if the user exists
            const userData = await fs.readFile(notesFilePath, "utf-8");
            const users = JSON.parse(userData);
            const user = users.find((u) => u.title === userName);
    
            if (!user) {
                return res.status(404).send("User not found");
            }
    
            // Check if the device exists
            const deviceData = await fs.readFile(devicesFilePath, "utf-8");
            const devices = JSON.parse(deviceData);
            const deviceIndex = devices.findIndex((device) => device.deviceId === deviceId);
    
            if (deviceIndex === -1) {
                return res.status(404).send("Device not found");
            }
    
         
            if (devices[deviceIndex].takenBy !== userName) {
                return res.status(400).send("Device is not currently taken by the specified user");
            }
    
            devices[deviceIndex].takenBy = null;
    
            
            await fs.writeFile(devicesFilePath, JSON.stringify(devices));
    
            res.status(200).send("Device released successfully");
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    });
    


    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * @swagger
 * /Device/photo/{deviceId}:
 *   get:
 *     summary: Get the photo of a device
 *     description: Retrieve the photo of a device by providing the device ID.
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int32
 *         description: ID of the device
 *     responses:
 *       200:
 *         description: Device photo retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Device or device photo not found
 *       500:
 *         description: Internal Server Error
 */
    
    app.get("/Device/photo/:deviceId", async (req, res) => {
        const deviceId = parseInt(req.params.deviceId);
    
        try {
            
             const deviceData = await fs.readFile(devicesFilePath, "utf-8");
             const devices = JSON.parse(deviceData);
       
            const device = devices.find((d) => d.deviceId === deviceId);
    
            if (!device) {
                return res.status(404).send("Device not found");
            }
    
         
            if (!device.imageUrl) {
                return res.status(404).send("Device photo not found");
            }
    
        
            const photoPath = path.join(__dirname, "uploads", device.imageUrl);
    
    
            res.sendFile(photoPath);
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    });