"""Default curated archive. Ratings are FaunaFlag's editorial opinion based on widely
reported production accounts; descriptions use "reportedly" where accounts are disputed."""

from lib.db import db
from models.film import Film

SEED_FILMS: list[dict] = [
    dict(title="The Adventures of Milo and Otis", year=1986, director="Masanori Hata", genre="Family", species=["Cat", "Dog"],
         flag="red", description="A kitten and a pug journey through the countryside using real animals in genuinely perilous situations: falling from cliffs, swept down rivers, fighting a bear. Persistent reports claim several kittens died during the long shoot; the claims have never been fully confirmed, but the on-screen peril is real."),
    dict(title="Apocalypse Now", year=1979, director="Francis Ford Coppola", genre="War", species=["Water buffalo"],
         flag="red", description="The climactic sequence intercuts with the real ritual slaughter of a water buffalo, filmed on camera. The killing was performed by local Ifugao people as part of a ceremony, but the death is real and shown in graphic detail."),
    dict(title="Cannibal Holocaust", year=1980, director="Ruggero Deodato", genre="Horror", species=["Turtle", "Monkey", "Pig", "Spider", "Snake"],
         flag="red", description="Several animals, including a turtle and a monkey, were killed for real on camera. The director later expressed regret, and many re-releases carry a disclaimer or cut the footage."),
    dict(title="Heaven's Gate", year=1980, director="Michael Cimino", genre="Western", species=["Horse", "Cattle", "Chicken"],
         flag="red", description="Reports from the production describe horses injured and killed (including one blown up with explosives), cockfights, and cattle bled for fake blood. The outcry helped expand American Humane's on-set monitoring."),
    dict(title="Roar", year=1981, director="Noel Marshall", genre="Adventure", species=["Lion", "Tiger", "Cheetah", "Elephant"],
         flag="red", description="Shot with more than 100 untrained big cats roaming freely around the cast. Dozens of cast and crew were injured. The animals were kept in conditions that would never be permitted today and were put under constant stress."),
    dict(title="Ben-Hur: A Tale of the Christ", year=1925, director="Fred Niblo", genre="Epic", species=["Horse"],
         flag="red", description="The silent-era chariot race is notorious. Contemporary accounts suggest many horses were killed or badly injured by tripwires and crashes during filming, at a time when there was no welfare oversight at all."),
    dict(title="Jesse James", year=1939, director="Henry King", genre="Western", species=["Horse"],
         flag="red", description="A blindfolded horse was driven off a cliff into a river for a stunt and died. The incident directly led to American Humane being given oversight of animal action on Hollywood sets."),
    dict(title="The Hobbit: An Unexpected Journey", year=2012, director="Peter Jackson", genre="Fantasy", species=["Horse", "Goat", "Sheep", "Chicken"],
         flag="red", description="Animal wranglers reported that up to 27 animals died on the farm where they were housed between scenes, due to unsafe terrain and poor conditions. No animal was reported harmed during actual filming."),
    dict(title="Pink Flamingos", year=1972, director="John Waters", genre="Cult Comedy", species=["Chicken"],
         flag="red", description="A chicken is crushed to death on camera during a scene. The crew reportedly ate it afterwards, but the killing is real and shown on screen."),
    dict(title="Andrei Rublev", year=1966, director="Andrei Tarkovsky", genre="Historical Drama", species=["Horse", "Cow"],
         flag="red", description="A horse was reportedly shot so it would fall down a staircase on camera, and a cow was set alight (reportedly with protective covering). The scenes are often cited as some of cinema's worst animal treatment."),
    dict(title="Life of Pi", year=2012, director="Ang Lee", genre="Adventure", species=["Tiger", "Zebra", "Hyena", "Orangutan"],
         flag="amber", description="The tiger Richard Parker is almost entirely CGI. However, a leaked report claimed a real tiger used for reference shots nearly drowned in a water tank. The film still received an American Humane certification."),
    dict(title="A Dog's Purpose", year=2017, director="Lasse Hallström", genre="Family Drama", species=["Dog"],
         flag="amber", description="Leaked footage showed a frightened German Shepherd being pushed into turbulent water. An independent investigation concluded the dog was not harmed and the video had been edited, but the footage caused a major boycott."),
    dict(title="The Wizard of Oz", year=1939, director="Victor Fleming", genre="Musical Fantasy", species=["Dog"],
         flag="amber", description="Terry, the Cairn Terrier who played Toto, was reportedly stepped on by an actor and suffered a sprained foot, which kept her off set for two weeks. Otherwise the dog was well cared for by her trainer."),
    dict(title="Old Yeller", year=1957, director="Robert Stevenson", genre="Family Drama", species=["Dog", "Wolf", "Boar"],
         flag="amber", description="A beloved family dog fights a wolf and wild hogs, catches rabies, and is shot by the boy who loves him. Every death is simulated, but the film is emotionally harrowing, especially for children."),
    dict(title="The Birds", year=1963, director="Alfred Hitchcock", genre="Thriller", species=["Gull", "Crow", "Raven"],
         flag="amber", description="Hundreds of trained and wild birds were used. For the attic scene, real birds were thrown at Tippi Hedren and some were tied to her costume. There is no confirmed harm to the birds, but the handling was stressful."),
    dict(title="Free Willy", year=1993, director="Simon Wincer", genre="Family", species=["Orca"],
         flag="amber", description="The film carries a pro-release message, but its star, the orca Keiko, lived in a small, poor-quality tank in a Mexico City amusement park. His fame later funded his rehabilitation and release."),
    dict(title="Dances with Wolves", year=1990, director="Kevin Costner", genre="Western", species=["Wolf", "Bison", "Horse"],
         flag="amber", description="The bison hunt combined trained bison, mechanical props and careful staging. The wolf Two Socks is shot within the story. The production was monitored, but the story's killings may upset viewers."),
    dict(title="John Wick", year=2014, director="Chad Stahelski", genre="Action", species=["Dog"],
         flag="amber", description="A puppy is killed off-screen early on, and his death drives the whole revenge plot. The real dogs were safe and monitored, but the violent death of a pet is the story's central trauma."),
    dict(title="Marley & Me", year=2008, director="David Frankel", genre="Comedy Drama", species=["Dog"],
         flag="amber", description="A warm film about a chaotic Labrador that ends with his illness and euthanasia, shown in an extended, tearful scene. Production was monitored and no harm was reported."),
    dict(title="Turner & Hooch", year=1989, director="Roger Spottiswoode", genre="Comedy", species=["Dog"],
         flag="amber", description="A slobbering Dogue de Bordeaux helps solve a case and is then shot and killed in the climax. The death is simulated, and the trained dog, Beasley, was well treated."),
    dict(title="Black Beauty", year=1994, director="Caroline Thompson", genre="Family Drama", species=["Horse"],
         flag="amber", description="The story deliberately depicts the cruelty working horses suffered in Victorian England, including bearing reins, overwork and neglect. The aim is to condemn it. Production was supervised with trained horses."),
    dict(title="Beethoven", year=1992, director="Brian Levant", genre="Family Comedy", species=["Dog"],
         flag="amber", description="The comic villain is a vet who plans lethal ammunition tests on dogs, and puppies are shown in cages. The St. Bernard performers were well cared for, but the theme of animal experiments runs throughout."),
    dict(title="Flipper", year=1963, director="James B. Clark", genre="Family", species=["Dolphin"],
         flag="amber", description="A friendly dolphin story that helped popularise keeping dolphins in captivity. Trainer Ric O'Barry later became an anti-captivity activist after one of the dolphin performers died."),
    dict(title="The Godfather", year=1972, director="Francis Ford Coppola", genre="Crime", species=["Horse"],
         flag="amber", description="The infamous severed horse head was real. It came from a dog-food processing plant and the horse was not killed for the film, but it is a genuine animal carcass used for shock."),
    dict(title="Eight Below", year=2006, director="Frank Marshall", genre="Adventure", species=["Dog", "Leopard seal"],
         flag="amber", description="Sled dogs left behind in Antarctica struggle to survive, and some die within the story. A fight with a leopard seal is shown. The film was carefully supervised, but the peril is sustained and upsetting."),
    dict(title="Kes", year=1969, director="Ken Loach", genre="Drama", species=["Kestrel"],
         flag="amber", description="A lonely boy trains a kestrel, and his brother kills it near the end. The birds were handled by falconers and not harmed, but the death of the bird is a devastating emotional blow."),
    dict(title="Watership Down", year=1978, director="Martin Rosen", genre="Animation", species=["Rabbit"],
         flag="amber", description="The film is animated, so no real animals were involved, but it shows rabbits dying graphically from gassing, snares and fights. It is notorious for traumatising children who expected a gentle cartoon."),
    dict(title="The Bear", year=1988, director="Jean-Jacques Annaud", genre="Adventure", species=["Bear", "Dog", "Puma"],
         flag="amber", description="Real trained bears, including a cub, perform alongside animatronics. Scenes show the cub's mother being killed and a puma attack. The production was humane, but some scenes put the animals in peril."),
    dict(title="Cujo", year=1983, director="Lewis Teague", genre="Horror", species=["Dog"],
         flag="amber", description="A rabid St. Bernard terrorises a family. Several trained dogs, a man in a dog suit and a mechanical head were used, and the dogs' 'foam' was a meringue mix. The violence and the dog's death are simulated."),
    dict(title="Pet Sematary", year=1989, director="Mary Lambert", genre="Horror", species=["Cat"],
         flag="amber", description="The family cat is killed by a truck and returns 'wrong'. The animal deaths are simulated and handled with makeup effects, but pet death is the story's central horror."),
    dict(title="Babe", year=1995, director="Chris Noonan", genre="Family", species=["Pig", "Dog", "Sheep", "Duck"],
         flag="green", description="Dozens of trained piglets were used alongside animatronics, all under American Humane monitoring. The film's message strongly favours animal empathy, and it inspired many viewers to give up pork."),
    dict(title="Homeward Bound: The Incredible Journey", year=1993, director="Duwayne Dunham", genre="Family", species=["Dog", "Cat"],
         flag="green", description="Two dogs and a cat cross the wilderness to get home. Dangerous moments used doubles, stuffed animals and careful staging, and all three pets return safely at the end."),
    dict(title="Hachi: A Dog's Tale", year=2009, director="Lasse Hallström", genre="Drama", species=["Dog"],
         flag="green", description="A loyal Akita waits years for his late owner. The film is deeply sad but contains no cruelty, and the dog performers were well cared for throughout."),
    dict(title="War Horse", year=2011, director="Steven Spielberg", genre="War Drama", species=["Horse"],
         flag="green", description="The horrors of war happen to horses within the story, but the barbed-wire scene used an animatronic horse. Production was closely monitored by American Humane with no reported harm."),
    dict(title="The Revenant", year=2015, director="Alejandro G. Iñárritu", genre="Western", species=["Bear", "Horse", "Bison"],
         flag="green", description="The famous bear attack is entirely CGI with a stunt performer. Animal carcasses appear, but no animals were harmed for the attack scenes."),
    dict(title="Rise of the Planet of the Apes", year=2011, director="Rupert Wyatt", genre="Science Fiction", species=["Chimpanzee", "Gorilla", "Orangutan"],
         flag="green", description="All the apes were created through performance capture, with no real primates used. The story itself is a strong critique of animal testing."),
    dict(title="Wendy and Lucy", year=2008, director="Kelly Reichardt", genre="Drama", species=["Dog"],
         flag="green", description="A quiet indie film about a woman searching for her lost dog, Lucy (played by the director's own dog). There is no animal peril beyond the separation, and the tone is tender."),
    dict(title="Paddington", year=2014, director="Paul King", genre="Family Comedy", species=["Bear"],
         flag="green", description="A fully CGI bear. A taxidermist villain threatens Paddington, but the story firmly rejects her, and no real animals were put at risk."),
    dict(title="The Lion King", year=2019, director="Jon Favreau", genre="Family", species=["Lion", "Warthog", "Meerkat", "Hyena"],
         flag="green", description="A photorealistic remake made entirely in computer animation. Mufasa's death is emotional, but no real animals were used."),
    dict(title="Jurassic Park", year=1993, director="Steven Spielberg", genre="Science Fiction", species=["Dinosaur", "Goat"],
         flag="green", description="The dinosaurs are animatronics and CGI. A goat is shown tethered as feed, but its death is only implied and the real goat was unharmed."),
    dict(title="Lassie Come Home", year=1943, director="Fred M. Wilcox", genre="Family", species=["Dog"],
         flag="green", description="A loyal Collie travels hundreds of miles home. Pal, the dog who played Lassie, was celebrated and well cared for, and the film presents abuse of dogs as clearly wrong."),
    dict(title="Seabiscuit", year=2003, director="Gary Ross", genre="Sports Drama", species=["Horse"],
         flag="green", description="The racing sequences were filmed with trained racehorses under strict monitoring and careful pacing. No harm was reported, and the horse is portrayed with dignity."),
    dict(title="Zootopia", year=2016, director="Byron Howard, Rich Moore", genre="Animation", species=["Rabbit", "Fox", "Various"],
         flag="green", description="An animated city of talking animals with a message about tolerance. There are no real animals and no cruelty beyond mild cartoon peril."),
    dict(title="Finding Nemo", year=2003, director="Andrew Stanton", genre="Animation", species=["Clownfish", "Shark", "Turtle"],
         flag="green", description="An animated ocean adventure. Nemo's mother is killed at the start, and the film critiques keeping wild fish in aquariums."),
    dict(title="Fantastic Mr. Fox", year=2009, director="Wes Anderson", genre="Stop-Motion", species=["Fox", "Badger", "Rat"],
         flag="green", description="A stop-motion film with puppets throughout. Farmers try to kill the foxes, but the animals win. No real animals were involved."),
    dict(title="Snow Dogs", year=2002, director="Brian Levant", genre="Family Comedy", species=["Dog"],
         flag="green", description="A slapstick sled-dog comedy with trained Huskies under humane supervision. The dogs are portrayed as beloved team members, with only light peril."),
]


async def reseed_films() -> int:
    """Restore the default archive without deleting admin-added films (upsert by title)."""
    for f in SEED_FILMS:
        existing = await db.films.find_one({"title": f["title"]}, {"_id": 0, "id": 1})
        if existing:
            await db.films.update_one({"id": existing["id"]}, {"$set": f})
        else:
            await db.films.insert_one(Film(**f).model_dump())
    return await db.films.count_documents({})


async def seed_if_empty() -> None:
    if await db.films.count_documents({}) == 0:
        await reseed_films()
