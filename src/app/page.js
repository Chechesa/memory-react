'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

export default function Home() {
  
  // Stores cards information retrieved from API
  const [cardsData, setCardsData] = useState(null)

  // Sound Effects has an audio tag independant to background music
  const soundEffects = useRef()

  // Reference to player Name Input to read and handle value internally
  const playerNameInput = useRef()

  // Reference to score SPANs
  const scoreCorrect = useRef()
  const scoreErrors = useRef()

  // Reference to First time game DIV
  const welcomeGame = useRef()



  // Reading stored playerName or setting empty
  let playerName = localStorage.getItem("playerName") || ""

  // Using cards value to show images and handle unique ids
  let cards = [];

  // Variables to handle player card selection
  let firstCard = -1
  let secondCard = -1;

  // Handling right and wrong card selection
  let errors = 0;
  let score = 0;

  // Handling Save and Start button, we use event to cancel submit and Ref to playerNameInput to get value
  const savePlayerName = async (event) => {
    event.preventDefault()
    playerName = playerNameInput.current.value
    localStorage.setItem("playerName", playerName)
    startGame()
  }

  // When player clicks one card, we handle it
  // Receive event and meta information (as card name) to work
  const selectCard = async (event, meta) => {
    // If there are revealed cards, we lock the selection (to allow animation to finish)
    if (secondCard == -1) {
      // We verify if clicked card is not revealed previously
      if (!event.currentTarget.classList.contains('revealed')) {
        event.currentTarget.classList.add('revealed')
        // If is the first card selection we handle it
        if (firstCard == -1) {
          // We save card data and DOM reference
          firstCard = { 
            meta: meta,
            card: event.currentTarget
          }
          // Play flipcard.mp3 sound effect
          audioSound(0);
        } else {
          // When first card is selected, we save second card info
          secondCard = { 
            meta: meta,
            card: event.currentTarget
          }

          // Then we compare if the card is from the same figure
          if (firstCard.meta.name == secondCard.meta.name) {
            // If is correct, we play correct.mp3 sound effect
            audioSound(1)
            // Adding 1 point to Correct Score
            score++
            // We update Score number
            scoreCorrect.current.textContent = score
            // We check if player has revealed all cards and we show a message
            if ((cardsData.length/2) == score) {
              setTimeout (() => {
                alert('Congratulations ' + playerName + '!!!')
              }, 1000)
            }

            // We reset first card and Second Card we don't need extra animations, card selection are released
            firstCard = -1
            secondCard = -1
          } else {
            // If is wrong, we play wrong.mp3 sound effect
            audioSound(-1)
            // We add a point to Wrong Score
            errors++
            // And update info
            scoreErrors.current.textContent = errors
            // We show the cards together 1 sec before hide figures, and release selection (to avoid player to click another card in this step)
            setTimeout(() => {
              firstCard.card.classList.remove('revealed')
              secondCard.card.classList.remove('revealed')
              firstCard = -1
              secondCard = -1
            }, 1000)
          }
        }
      }
    }
  }

  // We handle sound effects here, we receive effect param
  const audioSound = (effect) => {
    if (soundEffects.current) {
      switch (effect) {
        case -1:
          soundEffects.current.src = './error.mp3'
          break
        case 0:
          soundEffects.current.src = './flipcard.mp3'
          break;
        case 1:
          soundEffects.current.src = './correct.mp3'
          break;
      }
      soundEffects.current.play()
    } else {
      console.log("Error");
    }
  }

  // We create cards and shuffle it here
  const startGame = async () => {
    // We get cards from URI, page limit is 20, is also the cards number to play
    try {
      const res = await fetch(
        `https://fed-team.modyo.cloud/api/content/spaces/animals/types/game/entries?per_page=20`,
        {
          method: 'GET'
        }
      )
      const data = await res.json()
      console.log(data)
      cards = []
      // Creating two cards for each animal
      for (let i = 0; i < data.entries.length; i++) {
        // We clone information to add an unique id for react
        let cardA = {...data.entries[i]}
        let cardB = {...data.entries[i]}
        cardA.id = "a-" + cardA.meta.uuid
        cards.push(cardA)
        cardB.id = "b-" + cardB.meta.uuid
        cards.push(cardB)
      }

      // Using Durstenfeld shuffle method
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];

      }

      // We hide welcomeGame message and we show the cards in the board
      welcomeGame.current.classList.add('hidden')
      setCardsData(cards);
      
      // We log cards and show card name for help debug (answers)
      console.log(cards)
      for (let i = 0; i < cards.length; i++) {
        console.log(cards[i].meta.name)
      }
    } catch (err) {
      console.log(err)
    }
  }


  return (

<main className='min-h-screen md:container md:mx-auto text-center'>

  <audio src="./cardgame.mp3" autoPlay loop></audio>
  <audio ref={soundEffects}></audio>

  <div className='start-block w-full p-4' ref={welcomeGame}>
    {(playerName != '' && (
      <div>
        <p className='start-block__start-message'>Welcome back, {playerName}!</p>
        <button className='start-block__start-button bg-blue-500 text-white rounded-full py-2 px-4' onClick={startGame}>START</button>
      </div>
    )) || (
      <form className='start-block__player-form bg-white px-4 mb-4' onSubmit={savePlayerName}>
        <div className='mb-4'>
        <label htmlFor='start-block__player-input'>Player name</label>
        <input id='start-block__player-input' ref={playerNameInput} className='border w-full' type='text' name='playerNameInput' />
        <button type='submit' className='bg-blue-500 text-white rounded-full py-2 px-4'>Save name and Start game</button>
        </div>
      </form>
    )}
  </div>

  <div className='score-block grid grid-cols-2 gap-4 p-4'>
    <div className='score-block__correct'>✔ Corrects: <span ref={scoreCorrect}>{score}</span></div>
    <div className='score-block__errors'>❌ Misses: <span ref={scoreErrors}>{errors}</span></div>
  </div>

  <div className='grid grid-cols-4 gap-2 lg:gap-4 md:grid-cols-8 2xl:grid-cols-10 items-center justify-center'>
      {cardsData && cardsData.map(({id,meta,fields}) => (
    <div key={id} className='card h-32 w-20 lg:h-40 lg:w-24 2xl:h-50 2xl:w-30 items-center justify-center'>
      <div className='card__card-inner items-center justify-center' onClick={(event) => { selectCard(event, meta) }} >
        <div className='card__card-front'>
          <img className="h-32 w-20 lg:h-40 lg:w-24 2xl:h-50 2xl:w-30 object-cover mx-auto rounded-lg transition-all duration-500" src='./card-back.png' />
        </div>
        <div className='card__card-back'>
          <img className="h-32 w-20 lg:h-40 lg:w-24 2xl:h-50 2xl:w-30 object-cover mx-auto rounded-lg transition-all duration-500" src={fields.image.url} />
        </div>
      </div>
    </div>
      ))}
  </div>

</main>
  )
}
