import {AppUser, AppUserDTO} from "@/scripts/Model/AppUser";
import {Rank, RankDTO} from "@/scripts/Model/Rank";
import {Requirement, RequirementDTO} from "@/scripts/Model/Requirement";


async function seedDatabase() {
    console.log('Starting database seeding...');

    // Create Users
    const users: AppUserDTO[] = [
        { id: 1, fullName: "Anna Nowak", email: "anna.nowak@example.com", password: "password123", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 2, fullName: "Piotr Kowalski", email: "piotr.kowalski@example.com", password: "securepassword456", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 3, fullName: "Katarzyna Wiśniewska", email: "k.wisniewska@example.com", password: "mysecretpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 4, fullName: "Marcin Dąbrowski", email: "marcin.d@example.com", password: "userpass789", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 5, fullName: "Agnieszka Lewandowska", email: "agnieszka.l@example.com", password: "password2025", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 6, fullName: "Tomasz Wójcik", email: "tomasz.wojcik@example.com", password: "strongpassword1", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 7, fullName: "Małgorzata Kamińska", email: "m.kaminska@example.com", password: "kaminska123", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 8, fullName: "Jan Kowalczyk", email: "jan.kowalczyk@example.com", password: "jankowalczykpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 9, fullName: "Ewa Zielińska", email: "ewa.z@example.com", password: "zielinskaewa", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 10, fullName: "Krzysztof Szymański", email: "k.szymanski@example.com", password: "krzysiekpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 11, fullName: "Barbara Woźniak", email: "barbara.wozniak@example.com", password: "basiawozniak", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 12, fullName: "Andrzej Kozłowski", email: "andrzej.k@example.com", password: "passwordandrzej", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 13, fullName: "Joanna Jankowska", email: "j.jankowska@example.com", password: "joannapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 14, fullName: "Grzegorz Mazur", email: "grzegorz.mazur@example.com", password: "grzegorz123", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 15, fullName: "Magdalena Krawczyk", email: "magda.krawczyk@example.com", password: "magdalenapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 16, fullName: "Stanisław Grabowski", email: "stanislaw.g@example.com", password: "stangrab", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 17, fullName: "Monika Piotrowska", email: "monika.p@example.com", password: "monika1990", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 18, fullName: "Paweł Pawłowski", email: "pawel.pawlowski@example.com", password: "pawelpawel", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 19, fullName: "Zofia Michalska", email: "zofia.michalska@example.com", password: "zofiapassword", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 20, fullName: "Marek Król", email: "marek.krol@example.com", password: "krolmarek", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 21, fullName: "Teresa Wieczorek", email: "teresa.w@example.com", password: "teresapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 22, fullName: "Adam Jabłoński", email: "adam.jablonski@example.com", password: "adam12345", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 23, fullName: "Elżbieta Wójcik", email: "ela.wojcik@example.com", password: "elzbieta_pass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 24, fullName: "Jacek Majewski", email: "jacek.majewski@example.com", password: "majewski_jacek", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 25, fullName: "Danuta Nowakowska", email: "danuta.n@example.com", password: "danutapassword", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 26, fullName: "Robert Czerwiński", email: "robert.czerwinski@example.com", password: "robert123", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 27, fullName: "Irena Malinowska", email: "irena.malinowska@example.com", password: "irena_m", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 28, fullName: "Dariusz Sawicki", email: "d.sawicki@example.com", password: "darekpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 29, fullName: "Helena Górska", email: "helena.gorska@example.com", password: "helenapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 30, fullName: "Jerzy Sikora", email: "jerzy.sikora@example.com", password: "jerzysikora", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 31, fullName: "Alicja Witkowska", email: "alicja.w@example.com", password: "alicja1988", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 32, fullName: "Ryszard Rutkowski", email: "ryszard.rutkowski@example.com", password: "rychu_pass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 33, fullName: "Jadwiga Sokołowska", email: "jadwiga.s@example.com", password: "jadwiga123", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 34, fullName: "Czesław Michalak", email: "czeslaw.michalak@example.com", password: "czeslawpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 35, fullName: "Renata Szulc", email: "renata.szulc@example.com", password: "renataszulc", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 36, fullName: "Waldemar Barański", email: "waldemar.b@example.com", password: "waldek_b", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 37, fullName: "Wiesława Tomaszewska", email: "wieslawa.t@example.com", password: "wiesiapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 38, fullName: "Leszek Kalinowski", email: "leszek.kalinowski@example.com", password: "leszek1970", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 39, fullName: "Grażyna Adamska", email: "grazyna.adamska@example.com", password: "grazyna_a", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 40, fullName: "Sławomir Kaczmarczyk", email: "slawomir.k@example.com", password: "slawekpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 41, fullName: "Beata Borkowska", email: "beata.borkowska@example.com", password: "beataborkowska", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 42, fullName: "Wojciech Zając", email: "wojciech.zajac@example.com", password: "wojtekzajac", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 43, fullName: "Dorota Chmielewska", email: "dorota.c@example.com", password: "dorotapass1", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 44, fullName: "Artur Wysocki", email: "artur.wysocki@example.com", password: "arturpass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 45, fullName: "Natalia Maciejewska", email: "natalia.m@example.com", password: "natalia1234", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 46, fullName: "Roman Głowacki", email: "roman.glowacki@example.com", password: "romanglowacki", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 47, fullName: "Sylwia Laskowska", email: "sylwia.laskowska@example.com", password: "sylwiapass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 48, fullName: "Mirosław Kubiak", email: "miroslaw.kubiak@example.com", password: "mirek_kubiak", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] },
        { id: 49, fullName: "Justyna Zakrzewska", email: "justyna.z@example.com", password: "justyna_pass", role: "USER", ranksInProgressIds: [], mentorRanksInProgressIds: [], commentIds: [] }
    ];

    for (const user of users) {
        await AppUser.add(user);
    }
    console.log(`Added ${users.length} users`);

    // Create Rank: Przewodnik
    const przewodnikRank: RankDTO = {
        id: 1,
        fullName: "Przewodnik",
        shortName: "pwd",
        idea: "Swoją postawą propaguje harcerski system wartości wynikający z Przyrzeczenia i Prawa Harcerskiego. Poznaje siebie i motywy swojego postępowania. Pracuje nad własnymi słabościami i rozwija zdolności. Jest wzorem dla harcerzy. We współdziałaniu z dziećmi i młodzieżą znajduje radość, umie być starszym kolegą i przewodnikiem. Bierze aktywny udział w życiu drużyny, świadomie stosując metodę harcerską i wykorzystując przykład osobisty do realizacji celów wychowawczych. Ma poczucie odpowiedzialności za pracę i powierzoną grupę. Współtworzy hufcową wspólnotę. Ma świadomość wychowawczej roli służby w harcerstwie.",
        startRequirements: [
            "Złożenie Przyrzeczenia Harcerskiego",
            "Przedstawienie KSI programu swojej próby, zapewniającego realizację wymagań",
            "Ukończone 16 lat"
        ],
        endRequirements: [
            "Osiągnięcie poziomu opisanego w idei stopnia i zrealizowanie wymagań próby",
            "Przestrzeganie zasad „Polityki ochrony bezpieczeństwa dzieci w ZHP oraz innych przepisów dotyczących zasad bezpieczeństwa w pracy z dziećmi i młodzieżą",
            "Posiadanie wiedzy i umiejętności na poziomie stopnia harcerki orlej – harcerza orlego",
            "Ukończenie minimum 15-godzinnego kursu pierwszej pomocy zawierającego zajęcia w praktyce",
            "Pozytywnie oceniona służba w gromadzie/drużynie w okresie realizacji próby",
            "Ukończenie kursu przewodnikowskiego",
            "Posiadanie wiedzy i umiejętności odpowiadających wymaganiom stawianym wychowawcom wypoczynku"
        ],
        requirementIds: [],
        ranksInProgressIds: []
    };
    await Rank.add(przewodnikRank);
    console.log('Added Rank: Przewodnik');

    // Create Requirements for Przewodnik
    const przewodnikRequirements: RequirementDTO[] = [
        { id: 1, number: "1", content: "Kształtuje własną osobowość zgodnie z Prawem Harcerskim, w tym ułożył i konsekwentnie realizował plan swojego rozwoju.", rankId: 1, taskIds: [] },
        { id: 2, number: "2", content: "Pogłębia swoją wiedzę i rozwija swoje zainteresowania.", rankId: 1, taskIds: [] },
        { id: 3, number: "3", content: "Zachowuje właściwe proporcje w wypełnianiu obowiązków wynikających z przynależności do różnych grup społecznych (rodzina, szkoła, drużyna, środowisko zawodowe).", rankId: 1, taskIds: [] },
        { id: 4, number: "4", content: "Podejmuje stałą służbę w swoim harcerskim środowisku.", rankId: 1, taskIds: [] },
        { id: 5, number: "5", content: "Bierze udział w życiu hufca.", rankId: 1, taskIds: [] },
        { id: 6, number: "6", content: "W trakcie minimum 9-miesięcznej aktywnej służby w gromadzie/drużynie wykazał się umiejętnością pracy wychowawczej metodą harcerską z dziećmi lub młodzieżą w wybranej grupie wiekowej,", rankId: 1, taskIds: [] },
        { id: 7, number: "6.1", content: "w tym umiejętnościami: stosowania instrumentów metodycznych,", rankId: 1, taskIds: [] },
        { id: 8, number: "6.2", content: "w tym umiejętnościami: stosowania systemu małych grup,", rankId: 1, taskIds: [] },
        { id: 9, number: "6.3", content: "w tym umiejętnościami: tworzenia programu gromady/drużyny, jego realizacji i podsumowania,", rankId: 1, taskIds: [] },
        { id: 10, number: "6.4", content: "w tym umiejętnościami: pracy z Prawem i Przyrzeczeniem / Prawem i Obietnicą,", rankId: 1, taskIds: [] },
        { id: 11, number: "6.5", content: "w tym umiejętnościami: samodzielnego prowadzenia zbiórek", rankId: 1, taskIds: [] },
        { id: 12, number: "6.6", content: "oraz uczestniczył w: organizacji wyjazdowych form pracy wykorzystujących kontakt z przyrodą,", rankId: 1, taskIds: [] },
        { id: 13, number: "6.7", content: "oraz uczestniczył w: organizowaniu oraz przeprowadzeniu gier i form pracy w terenie uwzględniających współdziałanie i współzawodnictwo,", rankId: 1, taskIds: [] },
        { id: 14, number: "6.8", content: "oraz uczestniczył w: pozyskiwaniu środków finansowych lub innych form wsparcia działalności gromady/drużyny,", rankId: 1, taskIds: [] },
        { id: 15, number: "6.9", content: "oraz uczestniczył w: organizacji obozu (kolonii) lub zimowiska drużyny/gromady i pełnił na nim funkcję,", rankId: 1, taskIds: [] },
        { id: 16, number: "6.10", content: "oraz uczestniczył w: prowadzeniu dokumentacji niezbędnej do działania gromady/drużyny,", rankId: 1, taskIds: [] },
        { id: 17, number: "6.11", content: "oraz uczestniczył w: współpracy ze środowiskiem działania – rodzicami, szkołą itp.", rankId: 1, taskIds: [] },
        { id: 18, number: "7", content: "Wykazał się umiejętnością stosowania zasad dotyczących umundurowania, musztry, ceremoniału harcerskiego w pracy z drużyną.", rankId: 1, taskIds: [] },
        { id: 19, number: "8", content: "Wiedzę zdobytą w harcerskiej literaturze i mediach wykorzystał w pracy wychowawczej. Przeczytał minimum 3 książki harcerskie.", rankId: 1, taskIds: [] }
    ];

    for (const req of przewodnikRequirements) {
        await Requirement.add(req, przewodnikRank.id);
    }
    console.log(`Added ${przewodnikRequirements.length} requirements for Przewodnik`);

    // Create Rank: Podharcmistrz
    const podharcmistrzRank: RankDTO = {
        id: 2,
        fullName: "Podharcmistrz",
        shortName: "phm",
        idea: "Określa kierunki swojego rozwoju i je realizuje. Pracuje nad własnymi słabościami, przełamując je. Przykładem osobistym świadomie i pozytywnie oddziałuje na otoczenie. Rozumie ludzi i otaczającą go rzeczywistość – reaguje na ich potrzeby. Systematycznie stosuje służbę jako narzędzie harcerskiej pracy wychowawczej. Potrafi zauważyć sytuacje problemowe i je rozwiązywać. Umie spojrzeć na nie szerzej, niż tylko z perspektywy własnego środowiska. Buduje swój autorytet. Doskonali swą wiedzę i umiejętności wychowawcze. Dzieli się nimi z kadrą. Świadomie i konsekwentnie stosuje metodę harcerską. Pracuje w zespole instruktorskim. Ma własny pogląd na sprawy nurtujące jego środowisko harcerskie. Wzmacnia tożsamość harcerstwa.",
        startRequirements: [
            "Pozytywnie oceniana praca instruktorska przez co najmniej 12 miesięcy od przyznania stopnia przewodnika.",
            "Zaliczona służba instruktorska.",
            "Ukończone 18 lat.",
            "Przedstawienie KSI programu swojej próby zapewniającego realizację wymagań.",
            "Brał udział w doskonaleniu zastępowych, przybocznych.",
            "Ma doświadczenie na funkcji drużynowego lub przybocznego."
        ],
        endRequirements: [
            "Osiągnięcie poziomu opisanego w idei stopnia i zrealizowanie wymagań próby.",
            "Pozytywnie oceniona praca instruktorska w okresie realizacji próby.",
            "Ukończenie kursu podharcmistrzowskiego."
        ],
        requirementIds: [],
        ranksInProgressIds: []
    };
    await Rank.add(podharcmistrzRank);
    console.log('Added Rank: Podharcmistrz');

    // Create Requirements for Podharcmistrz
    const podharcmistrzRequirements: RequirementDTO[] = [
        { id: 20, number: "1", content: "Wykazał się umiejętnością pracy nad sobą, stawiania celów w życiu, podejmowania działań (do ich realizacji), ich oceny i wyciągania wniosków.", rankId: 2, taskIds: [] },
        { id: 21, number: "2", content: "Podnosi swoje umiejętności i kwalifikacje.", rankId: 2, taskIds: [] },
        { id: 22, number: "3", content: "Bierze czynny udział w życiu otaczającego go środowiska społecznego.", rankId: 2, taskIds: [] },
        { id: 23, number: "4", content: "W swojej pracy instruktorskiej świadomie wykorzystuje służbę.", rankId: 2, taskIds: [] },
        { id: 24, number: "5", content: "Wykazał się umiejętnością pracy w zespole, komunikowania się oraz motywowania innych. Zrealizował zadanie instruktorskie na poziomie szczepu lub hufca.", rankId: 2, taskIds: [] },
        { id: 25, number: "6", content: "Pogłębił znajomość harcerskiego systemu wychowawczego oraz zasad metodyki grup wiekowych.", rankId: 2, taskIds: [] },
        { id: 26, number: "7", content: "Stosuje metodę harcerską w pracy z instruktorami.", rankId: 2, taskIds: [] },
        { id: 27, number: "8", content: "Świadomie stosuje System pracy z kadrą.", rankId: 2, taskIds: [] },
        { id: 28, number: "9", content: "Pracuje nad swoją postawą instruktorską. Doskonali swoje umiejętności harcerskie i instruktorskie – w trakcie próby brał udział w minimum 2 wybranych formach kształceniowych.", rankId: 2, taskIds: [] },
        { id: 29, number: "10", content: "Przygotował się do roli opiekuna próby na stopnie instruktorskie.", rankId: 2, taskIds: [] },
        { id: 30, number: "11", content: "Pozyskał sojuszników do działalności harcerskiej.", rankId: 2, taskIds: [] },
        { id: 31, number: "12", content: "Pełnił funkcję instruktorską w czasie roku harcerskiego i był członkiem komendy kolonii/obozu lub zimowiska.", rankId: 2, taskIds: [] },
        { id: 32, number: "13", content: "Orientuje się w historii i aktualnej sytuacji harcerstwa. Korzysta z harcerskiej literatury i mediów. Przeczytał minimum 3 wybrane książki harcerskie.", rankId: 2, taskIds: [] },
        { id: 33, number: "14", content: "Wykazał się znajomością przepisów finansowych i organizacyjnych oraz zasad prowadzenia obozu harcerskiego odpowiadających wymaganiom stawianym kierownikom wypoczynku.", rankId: 2, taskIds: [] },
        { id: 34, number: "15", content: "Wykazał się umiejętnością pozyskiwania środków na działalność harcerską.", rankId: 2, taskIds: [] }
    ];

    for (const req of podharcmistrzRequirements) {
        await Requirement.add(req, podharcmistrzRank.id);
    }
    console.log(`Added ${podharcmistrzRequirements.length} requirements for Podharcmistrz`);

    console.log('Database seeding completed successfully!');
}

export default seedDatabase;