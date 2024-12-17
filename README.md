# ERD Designer

A powerful Entity Relationship Diagram (ERD) designer that can be embedded in your web applications. Built with modern web technologies, it provides an intuitive interface for creating and managing database schemas with real-time updates.

## Features

- Interactive diagram creation and editing
- Support for different relationship types (one-to-one, one-to-many, many-to-many)
- Arrow-based relationship notation
- Pan and zoom capabilities
- Undo/redo functionality
- Export diagrams as PNG
- Real-time updates via postMessage
- iframe integration support

## Embedding the ERD Designer

### Basic Integration

Add the ERD designer to your web application using an iframe:

```html
<!-- Read-only mode -->
<iframe 
  src="https://diagram.4geeks.com"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

#### Read-only mode

```html
<!-- Read-only mode -->
<iframe 
  src="https://diagram.4geeks.com/?allowExport=false&readOnly=true&zoomLevel=0.75&diagram=dealership" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

#### Loading a diagram using postMessage

```html
<!-- Loading a diagram using postMessage -->
<iframe id="erdDesigner"
  src="https://diagram.4geeks.com?theme=dark" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
<script>
  // Load initial diagram
  const erdFrame = document.getElementById('erdDesigner');
  erdFrame.addEventListener('load', () => {
    erdFrame.contentWindow.postMessage({
      type: 'loadERD',
      diagram: {
        tables: [
          {
            id: "t1",
            name: "Users",
            x: 100,
            y: 100,
            attributes: [
              { name: "id", type: "number", isPrimary: true },
              { name: "email", type: "string" }
            ]
          }
        ]
      }
    }, '*');
  });
</script>
```

### Query Parameters

| Parameter | Description | Possible Values | Default |
|-----------|-------------|-----------------|---------|
| theme | UI theme preference | 'light', 'dark' | 'dark' |
| readOnly | Disable editing capabilities | 'true', 'false' | 'false' |
| zoomLevel | Initial zoom level | '0.5' to '2.0' | '1.0' |
| showGrid | Display background grid | 'true', 'false' | 'true' |
| allowExport | Enable export functionality | 'true', 'false', 'png,json' | 'true' |
| diagram | Load a specific sample diagram | 'airline', 'school', 'dealership', 'store' | 'school' |
| allowNew | Control new diagram creation options | 'new,samples,load' or comma-separated subset | all enabled |

### PostMessage Communication

The ERD designer supports bi-directional communication with the parent window using the postMessage API.

#### Sending Messages to ERD Designer

```javascript
// Load a diagram
iframe.contentWindow.postMessage({
  type: 'loadERD',
  diagram: {
    tables: [
      {
        name: 'Users',
        x: 100,
        y: 100,
        attributes: [
          { name: 'id', type: 'number', isPrimary: true }
        ]
      }
    ]
  }
}, '*');

// Load diagram from URL
iframe.contentWindow.postMessage({
  type: 'loadERDFromUrl',
  url: 'https://your-api.com/diagrams/123'
}, '*');
```

#### Receiving Messages from ERD Designer

```javascript
window.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'erdUpdate':
      // Diagram was modified
      console.log('Diagram updated:', event.data.diagram);
      break;
    
    case 'erdLoaded':
      // Diagram was loaded successfully
      console.log('Diagram loaded:', event.data.diagram);
      break;
      
    case 'erdError':
      // An error occurred
      console.error('ERD error:', event.data.message);
      break;
  }
});
```

#### Message Types

##### Incoming Messages (Parent → ERD Designer)

| Type | Description | Payload |
|------|-------------|---------|
| loadERD | Load diagram directly | `{ diagram: Object }` |
| loadERDFromUrl | Load diagram from URL | `{ url: String }` |

##### Outgoing Messages (ERD Designer → Parent)

| Type | Description | Payload |
|------|-------------|---------|
| erdUpdate | Diagram was modified | `{ diagram: Object, timestamp: String }` |
| erdLoaded | Diagram loaded successfully | `{ diagram: Object, timestamp: String }` |
| erdError | Error occurred | `{ message: String, timestamp: String }` |

### Example Diagram Object Structure

```javascript
{
  "tables": [
    {
      "id": "t1",
      "name": "Users",
      "x": 100,
      "y": 100,
      "attributes": [
        {
          "name": "id",
          "type": "number",
          "isPrimary": true
        },
        {
          "name": "email",
          "type": "string"
        },
        {
          "name": "created_at",
          "type": "date"
        }
      ]
    },
    {
      "id": "t2",
      "name": "Posts",
      "x": 350,
      "y": 100,
      "attributes": [
        {
          "name": "id",
          "type": "number",
          "isPrimary": true
        },
        {
          "name": "user_id",
          "type": "number",
          "references": "Users.id"
        },
        {
          "name": "title",
          "type": "string"
        }
      ]
    }
  ],
  "viewState": {
    "offset": { "x": 0, "y": 0 },
    "scale": 1.0,
    "zoomIndex": 2
  }
}
```