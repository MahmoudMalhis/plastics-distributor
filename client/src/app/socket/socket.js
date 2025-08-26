// client/src/app/socket.js
import { io } from "socket.io-client";

// نفترض أن عنوان الخادم مضبوطة في متغيرات البيئة (مثل VITE_API_BASE_URL)
const socket = io(import.meta.env.VITE_API_BASE_URL, { autoConnect: false });

export default socket;
