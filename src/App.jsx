import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Game from './assets/Game';
import Home from './assets/Home'; // create this file
// import About from './About'; // create this file

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
