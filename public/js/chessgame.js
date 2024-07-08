const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let dragpiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "bg-green-600" : "bg-brown-200");
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;
            squareElement.classList.add("w-full", "h-full", "flex", "items-center", "justify-center");

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "text-white" : "text-black",
                    "text-4xl", // Make pieces larger
                    "font-bold" // Make pieces bold
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        dragpiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    dragpiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (dragpiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    const sourceSquare = convertToChessNotation(source);
    const targetSquare = convertToChessNotation(target);
    const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for simplicity
    });
    if (move) {
        socket.emit("move", move);
        renderBoard();
    } else {
        alert("Invalid move!");
    }
};

const convertToChessNotation = (square) => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return files[square.col] + (8 - square.row);
};

const getPieceUnicode = (piece) => {
    const unicodeMap = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    };
    return unicodeMap[piece.type.toUpperCase()];
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

renderBoard();