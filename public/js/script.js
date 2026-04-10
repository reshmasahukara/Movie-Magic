//to select un occupied seats
const seats = document.querySelectorAll(".row .seat:not(.occupied)");
const seatContainer = document.querySelector(".row-container");
//count no of elemts
const count = document.getElementById("count");
const total = document.getElementById("total");
const movieSelect = document.getElementById("movie");



populateUI();



//stores the ticket price in the form of numbers (we use +beforemovieSelect)
let ticketPrice = +movieSelect.value;

// Save selected seat type  and price
function setMovieData(movieIndex, moviePrice) {
  localStorage.setItem("selectedMovieIndex", movieIndex);
  localStorage.setItem("selectedMoviePrice", moviePrice);
}
//updating the total and count
function updateSelectedCount() {
  const selectedSeats = document.querySelectorAll(".container .selected");
//to find the postion or the index of the selected seat
//JSON.strigify is used to convert a java script file to jason string
  seatsIndex = [...selectedSeats].map(function(seat) {
    return [...seats].indexOf(seat);
  });

  localStorage.setItem("selectedSeats", JSON.stringify(seatsIndex));

0
  let selectedSeatsCount = selectedSeats.length;
  count.textContent = selectedSeatsCount;
  total.textContent = selectedSeatsCount * ticketPrice;

}

// Get data from localstorage and populate
// Get data from localstorage and populate
function populateUI() {
  const selectedSeats = JSON.parse(localStorage.getItem("selectedSeats"));

  if (selectedSeats !== null && selectedSeats.length > 0) {
    seats.forEach(function(seat, index) {
      if (selectedSeats.indexOf(index) > -1) {
        seat.classList.add("selected");
      }
    });
  }

  const selectedMovieIndex = localStorage.getItem("selectedMovieIndex");

  if (selectedMovieIndex !== null) {
    movieSelect.selectedIndex = selectedMovieIndex;
  }
  
}

// async function populateUI2() {
//   const selectedSeats = JSON.parse(localStorage.getItem("selectedSeats"));
  
//   // Fetch seat data from the API
//   try {
//     const response = await fetch("/seats");
//     const data = await response.json();
//     const seats = data.seats;

//     if (selectedSeats !== null && selectedSeats.length > 0) {
//       // Update the class of the selected seats to 'occupied'
//       selectedSeats.forEach(function(seatIndex) {
//         seats[seatIndex].classList.add("occupied");
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }

//   const selectedMovieIndex = localStorage.getItem("selectedMovieIndex");

//   if (selectedMovieIndex !== null) {
//     movieSelect.selectedIndex = selectedMovieIndex;
//   }
// }

// seat type select  event

movieSelect.addEventListener("change", function(e) {
  ticketPrice = +movieSelect.value;
  setMovieData(e.target.selectedIndex, e.target.value);
  updateSelectedCount();
});

// Adding selected class to only non-occupied seats on 'click'

seatContainer.addEventListener("click", function(e) {
  if (
    //class list for occupied seats and unoccupied seats
    e.target.classList.contains("seat") &&
    !e.target.classList.contains("occupied")
  ) {
    //when ever we click on any seat it will toggle
    e.target.classList.toggle("selected");
    updateSelectedCount();
  }
});

// Initial count and total rendering
updateSelectedCount();