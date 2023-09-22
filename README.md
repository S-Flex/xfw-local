# xfw-local
Deze applicatie maakt het mogelijk voor xfw-portal om lokaal op een pc opdrachten uit te voeren zoals file management.

# TODO
- Improve UI. Make it look like sign-spine css
- Look into application auto-update - https://www.electronjs.org/docs/latest/tutorial/updates
- Make installer for mac and windows
- Add remember me
- Store all logs on disc
- when storage persist. Logout not removing session!

## Express Endpoints Documentation

### GET /auth
This request is used to authenticate the app with a remote server.

**Parameters:**
- `url` (string): The URL of the Sign-spine website to authenticate with.
- `token` (string): The authentication token to use.

**Returns:**
- `ok` (string): Returns "ok" if authentication is successful.

**Throws:**
- `Error`: Throws an error if authentication fails.

### POST /ls
This request lists all files and directories in a directory.

**Parameters:**
- `path` (string): The path of the directory to list.

**Returns:**
- `Array`: Returns an array of objects representing the files and directories in the specified directory.

**Throws:**
- `Error`: Throws an error if the specified directory does not exist.

### POST /getFile
This request returns a file from path in base64.

**Parameters:**
- `path` (string): The path of the file to retrieve.

**Returns:**
- `Object`: Returns an object containing the name and base64-encoded contents of the specified file.

**Throws:**
- `Error`: Throws an error if the specified file does not exist.

### POST /moveFile
This request is used to rename a file and/or location.

**Parameters:**
- `path` (string): The path of the file to rename.
- `newLocation` (string): The new path and/or name of the file.

**Returns:**
- `ok` (string): Returns "ok" if the file is successfully renamed.

**Throws:**
- `Error`: Throws an error if the specified file does not exist.

### POST /copyFile
This request is used to duplicate files.

**Parameters:**
- `path` (string): The path of the file to duplicate.
- `newFile` (string): The path and/or name of the new file.

**Returns:**
- `ok` (string): Returns "ok" if the file is successfully duplicated.

**Throws:**
- `Error`: Throws an error if the specified file does not exist.

### POST /deleteFile
This request is used to unload(delete) a file from the local file system.

**Parameters:**
- `path` (string): The path of the file to delete.

**Returns:**
- `ok` (string): Returns "ok" if the file is successfully deleted.

**Throws:**
- `Error`: Throws an error if the specified file does not exist.

### POST /downloadFile
This method is used to upload a file to the local file system.

**Parameters:**
- `fileBase64` (string): The base64-encoded contents of the file to upload.
- `path` (string): The path of the directory to upload the file to.
- `fileName` (string): The name of the file to upload.

**Returns:**
- `ok` (string): Returns "ok" if the file is successfully uploaded.

**Throws:**
- `Error`: Throws an error if the specified directory does not exist or the app does not have permission to write to it.

### POST /createDirectory
This method is used to create a directory at a specific path.

**Parameters:**
- `path` (string): The path of the directory to create.

**Returns:**
- `ok` (string): Returns "ok" if the directory is successfully created.

**Throws:**
- `Error`: Throws an error if the specified directory already exists or the app does not have permission to create it.

### POST /deleteFolder
This method is used to delete a folder

**parameters:**
- `path` (string): The path of the directory to delete
- `recursive` (boolean) optional parameter to enable recursive delete. Use in case when folder contains other folders and/or files.

**Returns:**
- `ok` (string): Returns "ok" if the directory is successfully deleted.

**Throws:**
- `Error`: Throws an error if the specified directory does not exist or in non recursive mode if the folder contains files and/or folders.

### GET /getPrinters
This method is used to get a list of all available printers and possible page sizes.

**Returns**
List of printers with possible page sizes
```TypeScript
interface printer {
    name: string,
    description: string,
    status: string,
    printerSizes: Array<{width: number, height: Number} | string>
}
```


### POST /printFile
This method is used to print a file to a specific (label) printer.

**parameters:**
- `path` (string): A Path to a .html file containing the file that needs to be printed.
- `printerName` (string): The name of the printer that should be used. You can get the specific printer names from the /getPrinters request.
- `pageSize` ({width: number, height: Number} | string): The name or specific size of the page that should be printed. Width and height might be able to be adjustable from the standard sizes depending on the type of printer. Some label printers are able to cut to a specific length for example.

**Returns**
- `ok` (string): Returns "ok" if the file print task has been send successfully

**Throws:**
- `Error`: Throws an error if some parameters are missing or some of the options have been filled with invalid options such as a wrong printer name or illegal page sizes.