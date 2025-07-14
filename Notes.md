Algunas notas sobre los contractos:

1. Para sesiones privadas, muy poco flexible. Para mi una session privada es igual a una publica con whitelist, solo algunos pueden entrar. El mecanismo de pago no tiene por que ser "onCreate", ya que eso limita el feature. Que pasa si es un grupo privado que quiere pagar cada uno por su cuenta?

2. Tiene sentido que solo se pueda usar un token? seria nuestro token? A mi la solucion de nativeCurrency no me disgusta, en general si estas usando una blockchain, lo mas probable es que tengas saldo de esa blockchain y es menos probable que tengas saldo de algun ERC20 no?

3. ´´´
   newSession.participantDeposits[msg.sender] = \_amount;
   ´´´
   No necesariamente el creador de la session va a ser un participante, podria ser el mentor o alguien cuya wallet no sera participante.

4. Sessions contract no es pausable.

5. Cuando creo una session me obliga a depositar saldo
   Luego cuando quiero joinear, esta condicion me lo impide, pues ya puse saldo on create, pero mi address no es participant
   require(
   session.participantDeposits[msg.sender] == 0,
   AddressIsParticipant()
   );
