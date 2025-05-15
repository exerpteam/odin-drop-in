# ODIN Payment Drop-in Facade (`@exerp/odin-dropin`)

This package provides the public facade for integrating the ODIN Payment Drop-in component into web applications. It simplifies the interaction with the underlying Stencil web components and the `OdinPay.js` library.

## Installation

```bash
# Using pnpm
pnpm add @exerp/odin-dropin

# Using npm
npm install @exerp/odin-dropin

# Using yarn
yarn add @exerp/odin-dropin
```

## API Documentation

The primary export of this package is the `OdinDropin` class.

### Importing

```javascript
// ES Module import
import { OdinDropin, LogLevel } from '@exerp/odin-dropin';

// For UMD builds (if included via <script> tag),
// it should be available as a global variable `OdinDropin`.
// const odinDropinInstance = new window.OdinDropin({...});
```

### `new OdinDropin(params)`

Initializes a new instance of the ODIN Drop-in controller.

**Parameters:**

*   `params` (`OdinDropinInitializationParams`, **Required**): An object containing configuration parameters:
    *   `odinPublicToken` (`string`, **Required**): The short-lived public token obtained securely from your backend (which fetches it from the ODIN `/auth2/public-token` endpoint). This token is used to authenticate and initialize the underlying `OdinPay.js` library.
    *   `countryCode` (`'US' | 'CA'`, **Required**): Specifies the country for which the payment form should be configured. This influences aspects like postal code field labeling and validation rules within `OdinPay.js`.
    *   `paymentMethodType?` (`'CARD' | 'ACH'`, *Optional*, Default: `'CARD'`): Specifies the type of payment form to render.
        *   `'CARD'`: Renders the credit card payment form.
        *   `'ACH'`: Renders the ACH (bank account) payment form.
    *   `isSingleUse` (`boolean`, *Optional*, Default: `true`): Controls how the generated payment method token should be treated.
        *   `true`: Intended for a one-time payment.
        *   `false`: Intended for saving the payment method (e.g., for future Card-on-File or recurring payments).
    *   `billingFieldsConfig?` (`BillingFieldsConfig`, *Optional*): An object to configure the visibility and customize the appearance of billing address fields and other standard fields.
        *   **Usage for Credit Card:**
            *   For optional fields (e.g., `name`, `addressLine1`, `city`, `state`, `country`, `emailAddress`, `phoneNumber`):
                *   Omit the field key: The field will not be displayed.
                *   Set to `true`: The field will be displayed with its default label and placeholder.
                *   Set to a `FieldCustomization` object (e.g., `{ label: 'Your Name', placeholder: 'Full Name Here' }`): The field will be displayed with the specified custom label and/or placeholder. Empty strings for label/placeholder will effectively use the default.
            *   For fields that are always part of the form structure but whose labels/placeholders can be customized (`postalCode`, `cardInformation` label):
                *   Omit the field key or provide an empty `FieldCustomization` object: Default label/placeholder will be used.
                *   Set to a `FieldCustomization` object: The specified custom label and/or placeholder will be used. (Note: `cardInformation`'s internal placeholder is not configurable via this).
        *   **Example:**
            ```javascript
            billingFieldsConfig: {
                name: true, // Enable 'Name on Card' with default texts
                addressLine1: { label: 'Street Address', placeholder: 'E.g., 123 Main St' },
                city: { label: 'Town/City' }, // Custom label, default placeholder
                postalCode: { placeholder: 'ZIP / Postal Code' } // Custom placeholder for postal code
                // Other fields like addressLine2, state, country etc., will not be shown.
            }
            ```
        *   **Usage for ACH:** For ACH, the `name` field in `billingFieldsConfig` (if customized or enabled as `true`) refers to the "Account Holder Name". Other optional billing fields (`addressLine1`, `postalCode`, etc.) can also be configured and will be collected alongside ACH details. The fields `accountNumber`, `bankAccountType`, `routingNumber` (US), `transitNumber` (CA), and `institutionNumber` (CA) are core to the ACH form and their labels/placeholders can also be customized using their respective keys in `billingFieldsConfig` (e.g., `accountNumber: { label: 'Bank Account No.' }`).
        *   **Example (ACH field customization):**
            ```javascript
            billingFieldsConfig: {
                name: { label: 'Full Name on Account' }, // Custom label for Account Holder Name
                accountNumber: { placeholder: 'Enter your bank account number' },
                // addressLine1: true, // Optionally collect address
            }
            ```
        *   *(Refer to the exported `BillingFieldsConfig` and `FieldCustomization` types for full details.)*
    *   `logLevel?` (`LogLevel`, *Optional*, Default: `'WARN'`): 
        Controls the verbosity of messages logged to the browser console by the Drop-in component (both facade and core parts). Setting a level allows messages of that level and higher severity to be shown.
        *   Possible values: `'NONE'`, `'ERROR'`, `'WARN'`, `'INFO'`, `'DEBUG'`.
        *   `'NONE'`: No logs are shown.
        *   `'ERROR'`: Only critical errors are shown.
        *   `'WARN'`: Errors and warnings are shown.
        *   `'INFO'`: Errors, warnings, and informational messages (e.g., lifecycle events) are shown.
        *   `'DEBUG'`: All messages, including detailed debugging information, are shown.
    *   `onSubmit` (`(result: OdinSubmitPayload) => void`, **Required**): A callback function that will be invoked when the user successfully submits the payment form and `OdinPay.js` returns a payment method token.
        *   **Payload (`OdinSubmitPayload`):** An object containing:
            *   `paymentMethodId` (`string`): The tokenized payment method identifier generated by ODIN. Send this ID to your backend server to perform payment actions.
            *   `paymentMethodType` (`'CARD' | 'BANK_ACCOUNT'`): A string indicating the type of payment method tokenized. This helps in interpreting the `details` object.
            *   `billingInformation?` (`OdinPayBillingInformation`, *Optional*): An object containing the billing details entered by the user, if any billing fields were configured and submitted. Its structure is:
                ```typescript
                interface OdinPayBillingInformation {
                name?: string;
                emailAddress?: string;
                phoneNumber?: string;
                address?: {
                    addressLine1?: string;
                    addressLine2?: string;
                    city?: string;
                    state?: string;
                    postalCode?: string;
                    country?: string;
                };
                }
                ```
                Keys will be present if the corresponding field was configured. An empty string value means the field was configured but left blank by the user. If a field was not configured, its key will be omitted. The `address` object itself will be omitted if no address fields were configured.
            *   `details?` (`CardPaymentMethodDetails | AchPaymentMethodDetails | ...`, *Optional*): An object containing details specific to the `paymentMethodType`.
                *   If `paymentMethodType` is `'CARD'`, this will be a `CardPaymentMethodDetails` object:
                    ```typescript
                    interface CardPaymentMethodDetails {
                    cardBrand?: string;       // e.g., "VISA", "MASTERCARD"
                    last4?: string;           // Last four digits of the card number
                    maskedAccountNumber?: string; // The masked card number (e.g., "************1111")
                    expirationDate?: string;  // e.g., "12/2025"
                    binDetails?: any;         // Object containing BIN (Bank Identification Number) details
                    }
                    ```
                *   If `paymentMethodType` is `'BANK_ACCOUNT'`, this will be an `AchPaymentMethodDetails` object:
                    ```typescript
                    interface AchPaymentMethodDetails {
                      bankAccountType?: 'CHECKING' | 'SAVINGS'; // Type of the bank account
                      accountNumberLast4?: string;    // Last four digits of the bank account number
                      routingNumber?: string;         // The routing number (for US accounts)
                      transitNumber?: string;         // The transit number (for Canadian accounts)
                      institutionNumber?: string;     // The institution number (for Canadian accounts)
                      country?: 'US' | 'CA';          // The country context for the ACH details
                    }
                    ```
    *   `onError` (`(error: OdinPayErrorPayload) => void`, **Required**): A callback function invoked if an error occurs during the `OdinPay.js` submission process, during the initialization of `OdinPay.js`, or if an internal setup error occurs within the drop-in component.
        *   **Payload (`OdinPayErrorPayload`):** An object containing:
            *   `code` (`string`): An error code string indicating the nature of the error. Examples:
                *   `INIT_NO_KEY_PROVIDED`, `INIT_BADLY_FORMATTED_KEY`, `INIT_INVALID_KEY_STRUCTURE`, `INIT_UNSUPPORTED_COUNTRY`, `INIT_BT_SDK_FAILURE`, `INIT_NO_COUNTRY_CODE`, `INIT_NO_COUNTRY_CODE_FACADE`: Errors during OdinPay.js initialization or facade setup.
                *   `VALIDATION_ERROR_FIELDS`: Input validation failed for specific fields. See `fieldErrors`.
                *   `VALIDATION_ERROR_GENERAL`: General input validation failure. See `fieldErrors` (may contain entries with `field: "general[n]"`).
                *   `API_AUTH_ERROR`: An authentication error with the ODIN API (e.g., HTTP 401, often due to an expired or invalid public token).
                *   `API_CLIENT_ERROR`: A client-side error with the ODIN API (e.g., HTTP 4xx).
                *   `API_SERVER_ERROR`: A server-side error with the ODIN API (e.g., HTTP 5xx).
                *   `GENERAL_PAYMENT_ERROR`: A generic error during payment processing not covered by other codes.
                *   `ODIN_CALLBACK_ERROR`: A generic error originating from the OdinPay.js callback that couldn't be further categorized.
                *   `UNEXPECTED_CALLBACK_STRUCTURE`: The structure of the callback from OdinPay.js was not as expected.
                *   `MOUNT_POINT_NOT_FOUND`: The DOM element for mounting the drop-in was not found.
                *   `COMPONENT_CREATION_FAILED`: The Stencil web component could not be created.
                *   `SDK_LOAD_ERROR`: The OdinPay.js SDK failed to load.
                *   `UNKNOWN_ERROR`: An error occurred that could not be identified.
            *   `message` (`string`): A human-readable description of the error. For validation errors with `fieldErrors`, this might be a general summary. For API errors, it often contains the direct message from OdinPay.js.
            *   `fieldErrors?` (`Array<{ field: string, message: string }>`, *Optional*): An array of objects detailing field-specific validation errors. Each object contains:
                *   `field` (`string`): The name of the input field that failed validation (e.g., `"card"`, `"postalCode"`, `"name"`) or a generic identifier (e.g., `"general[0]"`) for errors not tied to a specific input.
                *   `message` (`string`): The validation error message for that specific field.
            *   `httpStatusCode?` (`number`, *Optional*): The HTTP status code if the error originated from an API call (e.g., `401`, `400`, `500`).
    *   `config` (`object`, *Optional*): A placeholder for future configuration options. Currently unused or for internal configuration (e.g., passing a simplified theme object to the core component - *Note: Theme pass-through not yet fully implemented*).

### `instance.mount(selectorOrElement)`

Mounts the ODIN Drop-in UI component into the specified DOM element.

**Parameters:**

*   `selectorOrElement` (`string | HTMLElement`, **Required**):
    *   If a string, it should be a CSS selector (e.g., `'#my-odin-container'`) pointing to the container element where the drop-in should be rendered.
    *   If an `HTMLElement`, it's the direct reference to the container element.
*   **Returns:** `void`

### `instance.unmount()`

Removes the ODIN Drop-in UI component from the DOM and cleans up associated event listeners.

*   **Parameters:** None
*   **Returns:** `void`

## Usage Example

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Odin Drop-in Test</title>
    <style>
        /* Basic button styling for this example */
        .odin-submit-button { /* Target class from internal component */
            padding: 10px 15px; background-color: #007bff; color: white;
            border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;
        }
        .odin-submit-button:disabled { opacity: 0.6; cursor: not-allowed; }
        #odin-container { max-width: 400px; padding: 20px; border: 1px solid #ccc; margin: 20px; min-height: 150px; }
        .error-message { color: red; margin-top: 10px; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Odin Payment Form Example</h1>
    <div id="odin-container">
        <!-- Drop-in will mount here -->
    </div>
    <div id="result-display"></div>
    <div id="error-display" class="error-message"></div>

    <script type="module" src="app.js"></script>
</body>
</html>
```

```javascript
// app.js
import { OdinDropin, BillingFieldsConfig } from '@exerp/odin-dropin';

const odinContainer = document.getElementById('odin-container');
const resultDisplay = document.getElementById('result-display');
const errorDisplay = document.getElementById('error-display');
let odinDropinInstance = null; // To hold the instance

// --- Fetch Public Token (Replace with your actual backend call) ---
async function getPublicToken() {
    // Simulate fetching from backend
    console.log("Fetching ODIN Public Token...");
    // In a real app, replace this with:
    // const response = await fetch('/api/get-odin-public-token');
    // if (!response.ok) throw new Error('Failed to fetch token');
    // const data = await response.json();
    // return data.publicToken;
    // For example purposes:
    return prompt("Enter ODIN Public Token:"); // DO NOT use prompt in production
}

// --- Initialize and Mount ---
async function initializeOdin() {
    if (!odinContainer) {
        console.error('Mount point not found');
        return;
    }

    try {
        const token = await getPublicToken();
        if (!token) {
            throw new Error('ODIN Public Token is required.');
        }

        const country = prompt("Enter Country Code (US or CA):"); // Example, get this from your app's context
        if (country !== 'US' && country !== 'CA') {
            throw new Error('Valid Country Code (US or CA) is required.');
        }

        const pmtType = confirm("Use ACH? (Cancel for Card)") ? 'ACH' : 'CARD'; // Example of selecting payment method type

        const enableNameField = confirm("Enable 'Name on Card' field?"); // Example
        const currentBillingFieldsConfig: BillingFieldsConfig = {
            name: enableNameField,
            // addressLine1: false, // Example for future fields
        };

        // Clean previous state if re-initializing
        if (odinDropinInstance) {
            odinDropinInstance.unmount();
        }
        if (resultDisplay) resultDisplay.textContent = '';
        if (errorDisplay) errorDisplay.textContent = '';

        odinDropinInstance = new OdinDropin({
            odinPublicToken: token,
            countryCode: country as 'US' | 'CA',
            paymentMethodType: pmtType as 'CARD' | 'ACH',
            isSingleUse: true, // Example: one-time payment
            billingFieldsConfig: currentBillingFieldsConfig,
            onSubmit: (result) => {
                console.log('onSubmit received:', result);
                let message = `Success! PM ID: ${result.paymentMethodId}\nType: ${result.paymentMethodType}`;

                if (result.paymentMethodType === 'CARD' && result.details) {
                    const cardDetails = result.details; // Type assertion might be needed in TS, not in JS example
                    message += `\nCard Brand: ${cardDetails.cardBrand || 'N/A'}`;
                    message += `\nLast 4: ${cardDetails.last4 || 'N/A'}`;
                    message += `\nExpires: ${cardDetails.expirationDate || 'N/A'}`;
                    // You might want to display maskedAccountNumber or binDetails too
                    // console.log('Masked Account Number:', cardDetails.maskedAccountNumber);
                    // console.log('BIN Details:', cardDetails.binDetails);
                } else if (result.paymentMethodType === 'BANK_ACCOUNT' && result.details) {
                    const achDetails = result.details as AchPaymentMethodDetails; // Type assertion for clarity
                    message += `\nAccount Type: ${achDetails.bankAccountType || 'N/A'}`;
                    message += `\nAccount Last4: ${achDetails.accountNumberLast4 || 'N/A'}`;
                    if (achDetails.routingNumber) message += `\nRouting: ${achDetails.routingNumber}`;
                    if (achDetails.transitNumber) message += `\nTransit: ${achDetails.transitNumber}`;
                    if (achDetails.institutionNumber) message += `\nInstitution: ${achDetails.institutionNumber}`;
                }

                if (result.billingInformation) {
                    message += `\nBilling Info: ${JSON.stringify(result.billingInformation, null, 2)}`;
                }

                if (resultDisplay) resultDisplay.textContent = message;
                if (errorDisplay) errorDisplay.textContent = '';
                
                alert(`Payment Method ID: ${result.paymentMethodId} - Review console for all details. Send ID to backend.`);
                // Optionally unmount after success:
                // odinDropinInstance.unmount();
            },
            onError: (error) => {
                console.error('onError received:', error);
                if (errorDisplay) errorDisplay.textContent = `Error: ${error.message}`;
                if (resultDisplay) resultDisplay.textContent = '';
            },
        });

        odinDropinInstance.mount(odinContainer); // Mount into the div element

    } catch (error) {
        console.error('Initialization or mounting failed:', error);
        if (errorDisplay) errorDisplay.textContent = `Error: ${error.message || error}`;
    }
}

// --- Run Initialization ---
initializeOdin();

// Example of how to unmount if needed later (e.g., on component destroy in a framework)
// function cleanup() {
//   if (odinDropinInstance) {
//     odinDropinInstance.unmount();
//     odinDropinInstance = null;
//     console.log('Odin Drop-in unmounted.');
//   }
// }
// window.addEventListener('beforeunload', cleanup); // Example cleanup trigger
