# Taller Reproductor de Música - Listas Dobles
### Interactive 3D Doubly Linked List Music Player Workshop

---

## 1. Project Title and Purpose

**Taller Reproductor de Música - Listas Dobles** is an educational, full-stack, university-level workshop application designed to provide an intuitive, visual, and spatial explanation of how a **Doubly Linked List** operates in computer science and software engineering.

Rather than presenting the doubly linked list as an abstract textbook diagram or a basic CRUD console exercise, this project implements a living, interactive, futuristic 3D music player. The playlist is not driven by index-based arrays (`songs[index + 1]`); instead, the **generic `DoublyLinkedList<Song>` is the single source of truth**, and playback traversal strictly adheres to:

$$\text{current} \leftarrow \text{current.next}$$
$$\text{current} \leftarrow \text{current.previous}$$

A 3D character avatar visually navigates along the physical bidirectional links between 3D floating song cards, celebrating on insertions, reacting with sorrow on deletions, and physically recoiling when hitting the boundaries of the list (`HEAD` or `TAIL`).

---

## 2. University Workshop Requirements & Fulfillment

| Requirement | Implementation Status | Technical Details |
|---|---|---|
| **TypeScript Architecture** | Full Compliance | 100% TypeScript in frontend and backend with strict mode enabled. |
| **Doubly Linked List as Core** | Full Compliance | Generic `DoublyLinkedList<T>` and `SongNode<T>` managing real nodes. |
| **No Array Navigation** | Full Compliance | Traversal uses exclusively `current.next` and `current.previous`. |
| **Insert at Beginning** | Full Compliance | `insertAtBeginning(data)` creates new `HEAD` in $O(1)$. |
| **Insert at End** | Full Compliance | `insertAtEnd(data)` creates new `TAIL` in $O(1)$. |
| **Insert at Position** | Full Compliance | `insertAtPosition(index, data)` connects predecessor and successor in $O(N)$. |
| **Delete Songs** | Full Compliance | `delete(id)` safely reconnects adjacent pointers. |
| **Advance / Rewind** | Full Compliance | Forward traversal via `next` and backward traversal via `previous`. |
| **Real Browser Audio** | Full Compliance | HTML5 Audio with synthesizer fallback and IndexedDB local file persistence. |
| **3D Spatial Visualization** | Full Compliance | Three.js scene featuring floating glassmorphic node cards & directional pointers. |
| **Character Avatar** | Full Compliance | 48 transparent sprite frames extracted from reference sheet; 12 animation states. |
| **UI in Spanish** | Full Compliance | Labels, tooltips, warnings, modal dialogs, and toasts in Spanish. |
| **Code in English** | Full Compliance | All classes, methods, variables, filenames, comments, and routes in English. |
| **Unit Testing** | Full Compliance | 15 comprehensive Vitest unit tests verifying all pointer invariants. |
| **Vercel Readiness** | Full Compliance | `vercel.json` and thin API adapter architecture for serverless execution. |

---

## 3. What is a Doubly Linked List?

A **Doubly Linked List** is a linear data structure consisting of sequentially linked records termed **Nodes**. Unlike a singly linked list where nodes only possess a forward reference (`next`), each node in a doubly linked list stores two memory pointers:

1. **`previous`**: A reference to the immediately preceding node (or `null` if the node is `HEAD`).
2. **`next`**: A reference to the immediately following node (or `null` if the node is `TAIL`).

```
                    DOUBLY LINKED LIST IN MEMORY
                    
              HEAD                                              TAIL
               │                                                 │
               ▼                                                 ▼
        ┌─────────────┐       ┌─────────────┐             ┌─────────────┐
null ◄──┤ previous    │ ◄───► │ previous    │ ◄─── ... ──►│ previous    │
        │ [ Song 1 ]  │       │ [ Song 2 ]  │             │ [ Song N ]  │
        │ next        ├───► ◄─┤ next        ├─── ... ────►│ next        ├──► null
        └─────────────┘       └─────────────┘             └─────────────┘
                                     ▲
                                     │
                                  CURRENT
```

### Pointer Invariants:
- For the first element (`HEAD`): $\text{HEAD.previous} = \text{null}$
- For the final element (`TAIL`): $\text{TAIL.next} = \text{null}$
- For any interior node $K$:
  $$\text{node}_K.\text{next}.\text{previous} = \text{node}_K$$
  $$\text{node}_K.\text{previous}.\text{next} = \text{node}_K$$

---

## 4. Why Use a Doubly Linked List for a Music Player?

Modern music playback systems require constant bidirectional movement:
- **Instant Next Song**: Moving to the subsequent track is an $O(1)$ pointer assignment:
  $$\text{current} = \text{current.next}$$
- **Instant Previous Song**: Returning to the previous track is likewise an $O(1)$ pointer assignment:
  $$\text{current} = \text{current.previous}$$
- **Zero Memory Shift on Insertion/Deletion**: In a continuous dynamic array, inserting a song at the beginning or in the middle requires shifting $N$ elements in memory ($O(N)$ copies). In a doubly linked list, an element is inserted or deleted simply by updating 4 pointer references in $O(1)$ once the position is located.
- **Dynamic Capacity**: The list can grow or shrink arbitrarily without needing contiguous blocks of heap allocation or resizing penalties.

---

## 5. System Architecture

```
music-player/
│
├── frontend/                     # Client application (Vite + TypeScript + Three.js)
│   ├── public/
│   │   └── assets/
│   │       ├── character/        # Original sprite reference & 48 extracted frames
│   │       │   └── frames/       # idle, walk, jump, celebrate, bounce, etc.
│   │       ├── covers/           # Futuristic synthwave album artworks
│   │       └── audio/            # Algorithmic demo synthesized audio loops
│   ├── src/
│   │   ├── animations/           # Character animator and GSAP transitions
│   │   ├── components/           # AudioPlayer, PlaylistView, EducationalPanel, Modals
│   │   ├── data-structures/      # SongNode<T>, DoublyLinkedList<T>
│   │   ├── models/               # Song, Playlist TypeScript interfaces
│   │   ├── services/             # AudioManager, StorageService (IndexedDB), ApiService
│   │   ├── styles/               # Glassmorphic CSS design system
│   │   ├── three/                # Three.js Scene, NodeCard3D, ConnectionLine3D, Character3D
│   │   ├── utils/                # Formatters, SampleSongs
│   │   └── main.ts               # Application orchestrator
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Clean Architecture REST API (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/          # PlaylistController
│   │   ├── middleware/           # errorHandler
│   │   ├── models/               # PlaylistDTO
│   │   ├── repositories/         # IPlaylistRepository, MemoryPlaylistRepository
│   │   ├── routes/               # playlistRoutes
│   │   ├── services/             # PlaylistService
│   │   └── server.ts             # Express entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── api/
│   └── index.ts                  # Thin Vercel serverless adapter
│
├── tests/
│   └── DoublyLinkedList.test.ts  # 15 Vitest unit tests verifying data structure integrity
│
├── README.md                     # Comprehensive documentation
├── package.json                  # Root npm workspace orchestrator
├── vercel.json                   # Vercel deployment configuration
└── .gitignore
```

---

## 6. The Character & Animation System

The application incorporates an interactive animated character derived directly from the project's hoodie-wearing sprite sheet reference.

### Sprite Frame Extraction
48 individual transparent PNG frames were algorithmically segmented using Python Pillow with flood-fill boundary transparency and stored into:
`frontend/public/assets/character/frames/<state>_<frame_index>.png`

### Character States (All 12 Implemented):
1. **`idle`**: Resting / paused state hovering above current node.
2. **`walk_forward`**: Traversal forward toward `current.next`.
3. **`walk_backward`**: Traversal backward toward `current.previous`.
4. **`jump`**: Landing celebration upon arriving at destination node.
5. **`celebrate`**: Triggered when a new song or playlist is created.
6. **`thinking`**: Triggered when playback is paused or data is loading.
7. **`confused`**: Triggered when attempting invalid navigation beyond boundaries.
8. **`sad`**: Triggered when a node is unlinked and deleted from the list.
9. **`angry`**: Triggered on input or operational errors.
10. **`bounce`**: Mechanical recoil triggered when hitting `HEAD` or `TAIL`.
11. **`reach`**: Triggered when reordering or shuffling nodes.
12. **`wave`**: Friendly welcome gesture when the application initializes.

---

## 7. Interactive 3D Spatial Environment

The Three.js visualizer renders the doubly linked list in 3D space:
- **`NodeCard3D`**: Floating cards featuring dynamic HTML5 canvas textures, displaying song titles, artists, indexes (`#1`, `#2`), simulated memory addresses (`0x3F2A`), and status badges (`HEAD`, `TAIL`, `ACTUAL`).
- **`ConnectionLine3D`**: Dual independent 3D Bézier curves representing the bidirectional link:
  - **Upper Cyan Curve**: Represents `node.next` with directional arrowhead pointing forward and animated flowing energy particles.
  - **Lower Purple Curve**: Represents `node.previous` with directional arrowhead pointing backward.
- **`ParticleEnvironment`**: Floating ambient dust field responding smoothly to audio playback.
- **Camera Tracking**: The camera and OrbitControls automatically pan and glide smoothly toward whichever node is set as `current`.

---

## 8. Backend API & Clean Architecture

The backend adheres strictly to Clean Architecture separation of concerns:
- **Routes** (`routes/playlistRoutes.ts`): Maps HTTP endpoints to controller handlers.
- **Controllers** (`controllers/PlaylistController.ts`): Extracts request parameters and delegates to service layer.
- **Services** (`services/PlaylistService.ts`): Implements business validation rules.
- **Repositories** (`repositories/IPlaylistRepository.ts` & `MemoryPlaylistRepository.ts`): Data persistence abstraction layer.

### Endpoints:
- `GET    /api/health` — Service liveness probe.
- `GET    /api/playlists` — Retrieves all playlists.
- `POST   /api/playlists` — Creates a new playlist.
- `GET    /api/playlists/:id` — Retrieves a playlist by identifier.
- `PUT    /api/playlists/:id` — Updates playlist metadata or song contents.
- `DELETE /api/playlists/:id` — Removes a playlist.

---

## 9. Installation and Setup

### Prerequisites:
- **Node.js**: v18.0.0 or higher (v26+ supported)
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
```

### 2. Run in Development Mode
To run both frontend and backend concurrently:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```
The frontend is available at: `http://localhost:5173/`  
The backend API is available at: `http://localhost:3001/`

---

## 10. Automated Testing

The doubly linked list test suite validates 15 distinct structural invariants:
1. Empty list initialization
2. Insert at beginning (`insertAtBeginning`)
3. Insert at end (`insertAtEnd`)
4. Insert at specific position (`insertAtPosition`)
5. Delete head (`delete`)
6. Delete tail (`delete`)
7. Delete middle node (`delete`)
8. Move next (`moveNext`)
9. Move previous (`movePrevious`)
10. Head and tail consistency
11. Previous pointer consistency across complete traversal
12. Next pointer consistency across complete traversal
13. Physical pointer rearrangement on shuffle (`shuffle`)
14. Node reordering (`reorder`)
15. Repeated bidirectional navigation limits

To execute the test suite:
```bash
npm test
```

---

## 11. Production Build & Vercel Deployment

### Build for Production:
```bash
npm run build
```
This compiles the backend TypeScript to `backend/dist` and bundles the frontend with Vite into `frontend/dist`.

### Vercel Deployment:
The project is configured for single-command Vercel deployment:
- `vercel.json` configures the static build directory (`frontend/dist`) and rewrites `/api/*` requests to the serverless function.
- `api/index.ts` serves as the thin serverless bridge without duplicating any backend business logic.

---

## 12. Educational Summary

Through this workshop, students observe that:
1. **Next and Previous are real memory references**, not numerical array offsets.
2. **`HEAD` is the entry point** into the chain; losing the `HEAD` reference in unmanaged memory without saving pointers results in a memory leak.
3. **`TAIL` provides $O(1)$ appending**; without a tail reference, appending would degrade to $O(N)$ traversal.
4. **Boundary conditions matter**: When `current.next === null`, advancing is impossible unless circular loop behavior is explicitly commanded.
