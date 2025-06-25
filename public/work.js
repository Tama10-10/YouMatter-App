const menuIcon = document.getElementById('menu-icon');
const navbar = document.getElementById('navbar');
const a=navbar.getElementsByTagName('a');
const login=document.getElementById('login');

function register()
{
    window.location.href = "register.html"; 
}


function show()
{
    
    

   
    if (navbar.style.height === '0px' || navbar.style.height === '') {
        navbar.style.height = '10.7rem';
        for (let i = 0; i < a.length; i++) {
            a[i].style.transform = 'translateY(0)';
            a[i].style.transitionDelay = 'calc(.15s*var(--i))';
            a[i].style.opacity='1';
        }
    } else {
        navbar.style.height = '0';
        for (let i = 0; i < a.length; i++) {
            a[i].style.transform = 'translateY(-50px)'; // Adjust as needed
            a[i].style.opacity='0';
        }

    }

    

}
function start()
{
    const computedStyle = window.getComputedStyle(login);
    if (computedStyle.display === "none") {
            login.style.display = "block";
            document.getElementById('strt').style.display="none";
            document.getElementById('strt-btn').style.display="none";
          

        } else {
            login.style.display = "none";
            document.getElementById('strt').style.display="block";
        }
}
// Wait 3 seconds before displaying the tagline
setTimeout(() => {
    const tagline = document.getElementById('tagline');
    tagline.style.display = 'block'; // Show the tagline
    tagline.classList.add('visible'); // Add class for fade-in effect (optional)
  }, 3000); // 3000 milliseconds = 3 seconds
  