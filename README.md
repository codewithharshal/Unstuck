# Unstuck

Unstuck is a full-stack social media application built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides a platform for users to create posts, engage in discussions through comments and replies, join subreddits, vote on content, and search for posts. Inspired by Reddit, Unstuck aims to help users get "unstuck" by sharing knowledge and experiences.

## Features

- **User Authentication**: Register and login with JWT-based authentication.
- **Posts and Comments**: Create, edit, delete posts and comments. Support for replies to comments.
- **Subreddits**: Create and join subreddits, view top subreddits.
- **Voting System**: Upvote and downvote posts, comments, and replies.
- **Search Functionality**: Search for posts across the platform.
- **User Profiles**: View user profiles, set and remove avatars.
- **Dark Mode**: Toggle between light and dark themes.
- **Responsive Design**: Built with Material-UI for a responsive user interface.
- **Image Upload**: Upload images to posts using Cloudinary.

## Tech Stack

### Backend

- **Node.js** with **Express.js** for the server framework.
- **MongoDB** with **Mongoose** for database management.
- **JWT** for authentication.
- **bcrypt** for password hashing.
- **Cloudinary** for image handling.
- **CORS** for cross-origin requests.
- **Express-async-errors** for error handling.

### Frontend

- **React** for the user interface.
- **Redux** for state management with Redux Thunk.
- **Material-UI** for UI components and theming.
- **Axios** for API requests.
- **Formik** with Yup for form handling and validation.
- **React Router** for client-side routing.
- **Timeago-react** for relative time display.

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (version 14 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

You will also need to set up environment variables for the backend (see Installation section).

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd Unstuckbackend
   ```

2. **Install backend dependencies:**

   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**

   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the `server` directory with the following variables:

   ```
   PORT=3005
   MONGODB_URI=mongodb://localhost:27017/unstuck  # or your MongoDB Atlas URI
   SECRET=your-jwt-secret-key
   CLOUDINARY_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   UPLOAD_PRESET=your-cloudinary-upload-preset
   ```

   Note: For Cloudinary setup, create an account at [Cloudinary](https://cloudinary.com) and configure an upload preset.

5. **Start MongoDB:**
   Ensure MongoDB is running locally or your Atlas cluster is accessible.

## Running the Application

1. **Start the backend server:**

   ```bash
   cd server
   npm run dev  # For development with nodemon
   # or
   npm start    # For production
   ```

   The server will run on `http://localhost:3005`.

2. **Start the frontend:**

   ```bash
   cd client
   npm start
   ```

   The React app will run on `http://localhost:3000` and proxy API requests to the backend.

3. **Build for production:**
   - To build the frontend and serve it from the backend:
     ```bash
     cd server
     npm run build:ui
     npm start
     ```
   - The built app will be served from the backend on the specified PORT.

## API Endpoints

### Authentication

- `POST /api/signup` - User registration
- `POST /api/login` - User login

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/search` - Search posts
- `GET /api/posts/:id/comments` - Get post with comments
- `GET /api/posts/subscribed` - Get subscribed posts (auth required)
- `POST /api/posts` - Create new post (auth required)
- `PATCH /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)
- `POST /api/posts/:id/upvote` - Upvote post (auth required)
- `POST /api/posts/:id/downvote` - Downvote post (auth required)

### Comments

- `POST /api/posts/:id/comment` - Post comment (auth required)
- `DELETE /api/posts/:id/comment/:commentId` - Delete comment (auth required)
- `PATCH /api/posts/:id/comment/:commentId` - Update comment (auth required)
- `POST /api/posts/:id/comment/:commentId/reply` - Post reply (auth required)
- `DELETE /api/posts/:id/comment/:commentId/reply/:replyId` - Delete reply (auth required)
- `PATCH /api/posts/:id/comment/:commentId/reply/:replyId` - Update reply (auth required)
- `POST /api/posts/:id/comment/:commentId/upvote` - Upvote comment (auth required)
- `POST /api/posts/:id/comment/:commentId/downvote` - Downvote comment (auth required)
- `POST /api/posts/:id/comment/:commentId/reply/:replyId/upvote` - Upvote reply (auth required)
- `POST /api/posts/:id/comment/:commentId/reply/:replyId/downvote` - Downvote reply (auth required)

### Subreddits

- `GET /api/subreddits` - Get all subreddits
- `GET /api/subreddits/r/:subredditName` - Get posts from a subreddit
- `GET /api/subreddits/top10` - Get top 10 subreddits
- `POST /api/subreddits` - Create new subreddit (auth required)
- `PATCH /api/subreddits/:id` - Edit subreddit description (auth required)
- `POST /api/subreddits/:id/subscribe` - Subscribe to subreddit (auth required)

### Users

- `GET /api/users/:username` - Get user profile
- `POST /api/users/avatar` - Set user avatar (auth required)
- `DELETE /api/users/avatar` - Remove user avatar (auth required)

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Make your changes and commit: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

This project is licensed under the ISC License.
