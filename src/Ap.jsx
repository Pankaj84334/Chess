import axios from "axios";
import { useRef, useState, useEffect } from "react";

function App() {
  const inputRef = useRef();
  const [reply, setReply] = useState("");

  const handleSend = async () => {
    const message = inputRef.current.value;
    try {
      const res = await axios.post("http://localhost:3001/chat", { message });
      const aiResponse = Array.isArray(res.data.reply) ? res.data.reply.join(" ") : res.data.reply;
      setReply(aiResponse);
      speak(aiResponse);
    } catch (err) {
      console.error(err);
      setReply("Error talking to AI");
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.8;
    utterance.pitch=5;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <h2>Chat</h2>
      <textarea ref={inputRef}></textarea><br />
      <button onClick={handleSend}>Send</button>
      <p><strong>AI:</strong>{reply}</p>
    </>
  );
}

export default App;
