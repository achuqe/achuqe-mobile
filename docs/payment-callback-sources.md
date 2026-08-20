# ბანკური გადახდის callback-ის წყაროები

რეალური ბანკური გადახდის ინტეგრაცია ამ ეტაპზე გადადებულია merchant credentials-ის მიღებამდე. შემდგომი განხორციელება უნდა დაეყრდნოს მხოლოდ ბანკის საბოლოო სტატუსის დადასტურებას; redirect ან callback თავისთავად არ უნდა ჩაითვალოს გადახდის დადასტურებად.

| პროვაიდერი | მნიშვნელოვანი წესი | ოფიციალური წყარო |
|---|---|---|
| TBC Bank | საბოლოო სტატუსის ცვლილებისას callback URL იღებს `PaymentId`-ს; სერვერმა უნდა უპასუხოს HTTP 200-ით და შემდეგ სტატუსი გადაამოწმოს Get Payment endpoint-ით. | [TBC E-Commerce payment](https://developers.tbcbank.ge/docs/checkout-create-checkout-payment) |
| Bank of Georgia | გადახდის დასრულების შემდეგ ბანკი აგზავნის ასინქრონულ callback-ს მითითებულ callback URL-ზე; ამ მოვლენის საფუძველზე უნდა განახლდეს შეკვეთა. | [BOG Online Payment API](https://api.bog.ge/docs/en/payments/introduction) |

მომზადებისას საჭიროა ორივე ბანკის merchant sandbox/production credentials, დარეგისტრირებული HTTPS callback URL და idempotency შემოწმება order/payment ID-ებით.
