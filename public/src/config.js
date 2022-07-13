class Config {
    static h = 8;
    static w = 8;
    static t = 6;
    static winRate = 0.45;
    //static winRate = 0.2;
    //static winRate = 0.05;
    static avatars = ['tile-0', 'tile-1', 'tile-2', 'tile-3', 'tile-4', 'tile-5', 'bomb']
    static capturedCssClass = 'captured';
    static capturedOpponentCssClass = 'captured-opponent';
    //static webSocketAddress = "ws://match3.ddns.net:8080";
    //static webSocketAddress = "ws://match3-server.herokuapp.com";
    //static webSocketAddress = "ws://192.168.0.105:8080";
    //static webSocketAddress = "ws://192.168.0.105:3000";
    static textOpponentsTurn = "Seu oponente está pensando...";
    static textYourTurn = "Agora é sua vez, faça seu movimento!";
    static robotName = "CyBorg";
}
export { Config };