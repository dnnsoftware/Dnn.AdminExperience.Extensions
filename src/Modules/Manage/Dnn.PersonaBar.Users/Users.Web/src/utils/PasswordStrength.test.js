import passwordStrength from "./PasswordStrength";


describe("Util PasswordStrengh",() => {
    const defaultOptions = {
        minLength:7,
        minNumberOfSpecialChars:1,
        validationExpression:""

    };

    it("Should password Asdf1234! be rating 5",()=> {
        const password = "Asdf1234!";
        expect(passwordStrength(password,defaultOptions).rating).toBe(5);
    });


    it("Should password Asdf1234 be rating 4", ()=>{
        const password = "Asdf1234";
        expect(passwordStrength(password,defaultOptions).rating).toBe(4);
    });

    it("Should password asdf1234 be rating 3", () => {
        const password = "asdf1234";
        expect(passwordStrength(password,defaultOptions).rating).toBe(3); 
    });
    
    it("Should password asdf1 to be rating 2", ()=>{
        const password = "asdf1";
        expect(passwordStrength(password,defaultOptions).rating).toBe(2);
    });

    it("Should password asdf be rating 1", ()=> {
        const password = "asdf";
        expect(passwordStrength(password,defaultOptions).rating).toBe(1);
    });

    it("Should password length has minLength+3, increase the rating",()=>{
        const password = "asdfasdffg";
        expect(passwordStrength(password,defaultOptions).rating).toBe(3);
    });

    it("Should validate regular expression when it is present on configuration", () => {
        const password = "Asd1234!asdf";
        const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        const regExpOptions = {...defaultOptions,validationExpression:strongRegex};
        expect(passwordStrength(password,regExpOptions).rating).toBe(6);
    });
});