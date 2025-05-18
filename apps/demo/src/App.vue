<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import {
  OdinDropin,
  OdinPayErrorPayload,
  FieldCustomization,
  OdinSubmitPayload,
  type LogLevel,
} from "@exerp/odin-dropin";

type DropinBillingFieldsConfig =
  import("@exerp/odin-dropin").BillingFieldsConfig;

const availableLogLevels: LogLevel[] = [
  "NONE",
  "ERROR",
  "WARN",
  "INFO",
  "DEBUG",
];

// --- State ---
const odinPublicToken = ref("");
const countryCode = ref<"US" | "CA">("US");
const paymentMethodType = ref<"CARD" | "ACH">("CARD");
const selectedLogLevel = ref<LogLevel>("WARN");
const dropinContainerRef = ref<HTMLElement | null>(null);
const paymentMethodId = ref<string | null>(null);
const paymentResult = ref<OdinSubmitPayload | null>(null);
const displayedError = ref<OdinPayErrorPayload | null>(null);
let odinDropinInstance: OdinDropin | null = null; // To store the instance

const fieldConfigs = ref<
  Record<string, { enabled: boolean } & FieldCustomization>
>({
  // --- Mandatory fields only have customization ---
  postalCode: { enabled: true, label: "", placeholder: "" },
  cardInformation: { enabled: true, label: "", placeholder: "" },
  // Initialize config for all fields we want to control
  // not putting all the fields here to avoid clutter
  name: { enabled: false, label: "", placeholder: "" },
  // addressLine1: { enabled: false, label: "", placeholder: "" },
  // addressLine2: { enabled: false, label: "", placeholder: "" },
  // city: { enabled: false, label: "", placeholder: "" },
  // state: { enabled: false, label: "", placeholder: "" },
  // country: { enabled: false, label: "", placeholder: "" },
  // emailAddress: { enabled: false, label: "", placeholder: "" },
  phoneNumber: { enabled: false, label: "", placeholder: "" },
});

const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  name: "Full Name",
  postalCode: "Postal Code",
  addressLine1: "Street Address",
  addressLine2: "Apartment, suite, etc.",
  city: "City",
  state: "State / Province",
  country: "Country",
  emailAddress: "you@example.com",
  phoneNumber: "(123) 456-7890",
  cardInformation: "", // No configurable placeholder
};

const DEFAULT_LABELS: Record<string, string> = {
  name: "Name on Card",
  postalCode: "Postal Code",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2 (Optional)",
  city: "City",
  state: "State / Province",
  country: "Country",
  emailAddress: "Email Address",
  phoneNumber: "Phone Number",
  cardInformation: "Card Information",
};

function getDefaultPlaceholder(
  fieldName: keyof typeof fieldConfigs.value
): string {
  return DEFAULT_PLACEHOLDERS[fieldName] || "";
}
function getDefaultLabel(fieldName: keyof typeof fieldConfigs.value): string {
  return DEFAULT_LABELS[fieldName] || fieldName;
}

const currentBillingFieldsConfig = computed((): DropinBillingFieldsConfig => {
  const config: DropinBillingFieldsConfig = {};
  for (const fieldName in fieldConfigs.value) {
    const fieldConf = fieldConfigs.value[fieldName];

    // Handle optional fields
    if (fieldName !== "postalCode" && fieldName !== "cardInformation") {
      if (fieldConf.enabled) {
        // If enabled, check if there's customization
        if (fieldConf.label || fieldConf.placeholder) {
          // Pass customization object
          config[fieldName] = {
            label: fieldConf.label || undefined, // Pass undefined if empty string
            placeholder: fieldConf.placeholder || undefined, // Pass undefined if empty string
          };
        } else {
          // Pass true for default behavior
          config[fieldName] = true;
        }
      }
      // If not enabled, the key is simply omitted from 'config'
    }
    // Handle mandatory fields (postalCode, cardInformation) - only pass customization if present
    else {
      if (fieldConf.label || fieldConf.placeholder) {
        config[fieldName] = {
          label: fieldConf.label || undefined,
          placeholder: fieldConf.placeholder || undefined,
        };
      }
      // If no customization, omit the key (no 'true' needed for mandatory fields)
    }
  }
  console.log(
    "[Demo App] Generated billingFieldsConfig:",
    JSON.stringify(config)
  ); // Debug log
  return config;
});

// --- Methods ---
async function initializeAndMountDropin() {
  paymentMethodId.value = null;
  paymentResult.value = null;
  displayedError.value = null;
  console.log("[Demo App] Attempting to initialize Drop-in...");

  if (!odinPublicToken.value) {
    displayedError.value = {
      code: "DEMO_APP_VALIDATION",
      message: "Please provide an ODIN Public Token.",
    };
    console.error("[Demo App] Error: No ODIN Public Token provided.");
    return;
  }

  if (
    !countryCode.value ||
    (countryCode.value !== "US" && countryCode.value !== "CA")
  ) {
    displayedError.value = {
      code: "DEMO_APP_VALIDATION",
      message: "Please select a valid Country Code (US or CA).",
    };
    console.error("[Demo App] Error: Invalid country code selected.");
    return;
  }

  if (!dropinContainerRef.value) {
    displayedError.value = {
      code: "DEMO_APP_ERROR",
      message: "Drop-in container element not found.",
    };
    console.error("[Demo App] Error: Drop-in container element not found.");
    return;
  }

  // Unmount previous instance if exists
  if (odinDropinInstance) {
    odinDropinInstance.unmount();
    odinDropinInstance = null;
  }

  // Wait for the DOM to be ready, especially if container was conditionally rendered
  await nextTick();

  try {
    console.log(
      `[Demo App] Initializing OdinDropin with token: ${odinPublicToken.value}, country: ${countryCode.value}, paymentMethodType: ${paymentMethodType.value}`
    );
    // Actual Drop-in Initialization Logic
    odinDropinInstance = new OdinDropin({
      odinPublicToken: odinPublicToken.value,
      countryCode: countryCode.value,
      billingFieldsConfig: currentBillingFieldsConfig.value,
      logLevel: selectedLogLevel.value,
      paymentMethodType: paymentMethodType.value,
      onSubmit: (result) => {
        console.log("[Demo App] onSubmit:", result);
        paymentMethodId.value = result.paymentMethodId;
        paymentResult.value = result;
        displayedError.value = null;

        console.log(
          "[Demo App] onSubmit paymentMethodType from result:",
          result.paymentMethodType
        );
        if (result.paymentMethodType === "BANK_ACCOUNT" && result.details) {
          // ⚠️ Note: Report says 'BANK_ACCOUNT', our type says 'ACH'. We need to align this. For now, let's assume our types are what we expect from the facade.
          const achDetails = result.details; // Will be AchPaymentMethodDetails
          console.log("[Demo App] ACH Details:", achDetails);
        }
      },
      onError: (error) => {
        console.error("[Demo App] onError:", error);
        displayedError!.value = error;
        paymentMethodId.value = null;
        paymentResult.value = null;
      },
    });

    // Pass the actual HTMLElement to mount
    odinDropinInstance.mount(dropinContainerRef.value);
    console.log(
      "[Demo App] Drop-in mount called on:",
      dropinContainerRef.value
    );
  } catch (error: any) {
    console.error("Failed to initialize or mount Drop-in:", error);
    displayedError.value = {
      // Store a similar structured error for demo's own exceptions
      code: "DEMO_INIT_EXCEPTION",
      message: `Failed to initialize Drop-in instance: ${error.message || error}`,
    };
  }
}

// --- Lifecycle ---
onMounted(() => {
  // Auto-mount if token pre-filled (optional, for faster testing)
  // if (odinPublicToken.value && dropinContainerRef.value) {
  //   initializeAndMountDropin();
  // }
});
</script>

<template>
  <div class="demo-container">
    <h1>Exerp ODIN Drop-in Demo (Vue + TS)</h1>

    <!-- Global Configuration Section -->
    <div class="global-config-section">
      <h2>Global Configuration</h2>
      <div class="global-config-row">
        <label for="publicToken" class="sr-only">ODIN Public Token:</label>
        <!-- sr-only for accessibility if label is visually implied -->
        <input
          id="publicToken"
          type="text"
          v-model="odinPublicToken"
          placeholder="Paste your test public token here"
          class="full-width-input"
        />
      </div>
      <div class="global-config-row multi-control-row">
        <div>
          <label for="countryCode">Country Code:</label>
          <select id="countryCode" v-model="countryCode">
            <option value="US">US - United States</option>
            <option value="CA">CA - Canada</option>
          </select>
        </div>
        <div>
          <label>Payment Method:</label>
          <div class="radio-group-pmt">
            <input
              type="radio"
              id="pmtCard"
              value="CARD"
              v-model="paymentMethodType"
            />
            <label for="pmtCard">Card</label>
            <input
              type="radio"
              id="pmtAch"
              value="ACH"
              v-model="paymentMethodType"
            />
            <label for="pmtAch">ACH (Bank)</label>
          </div>
        </div>
        <div>
          <label for="logLevelSelect">Log Level:</label>
          <select id="logLevelSelect" v-model="selectedLogLevel">
            <option
              v-for="level in availableLogLevels"
              :key="level"
              :value="level"
            >
              {{ level }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <!-- END: Global Configuration Section -->

    <div class="layout-container">
      <!-- Column for Billing Field Configuration -->
      <div class="config-column">
        <div class="config-section">
          <!-- This was previously named 'config-section', keeping for styles -->
          <h3
            style="
              margin-top: 0; /* Adjusted for new layout */
              margin-bottom: 15px;
              border-top: none; /* Removed top border as it's now distinct */
              padding-top: 0; /* Removed top padding */
            "
          >
            Billing Field Configuration:
          </h3>

          <template
            v-for="(fieldData, fieldName) in fieldConfigs"
            :key="fieldName"
          >
            <div class="field-config-item">
              <h4>
                {{
                  fieldName === "name"
                    ? "Name on Card"
                    : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
                }}
                Field ('{{ fieldName }}')
              </h4>

              <div
                class="field-config-row"
                v-if="
                  fieldName !== 'postalCode' && fieldName !== 'cardInformation'
                "
              >
                <label :for="`enable-${fieldName}`">Enable:</label>
                <input
                  type="checkbox"
                  :id="`enable-${fieldName}`"
                  v-model="fieldData.enabled"
                />
              </div>

              <div class="field-config-row">
                <label :for="`label-${fieldName}`">Custom Label:</label>
                <input
                  type="text"
                  :id="`label-${fieldName}`"
                  v-model="fieldData.label"
                  :placeholder="`Default: ${getDefaultLabel(fieldName as keyof typeof fieldConfigs)}`"
                  :disabled="
                    fieldName !== 'postalCode' &&
                    fieldName !== 'cardInformation' &&
                    !fieldData.enabled
                  "
                />
              </div>

              <div
                class="field-config-row"
                v-if="fieldName !== 'cardInformation'"
              >
                <label :for="`placeholder-${fieldName}`"
                  >Custom Placeholder:</label
                >
                <input
                  type="text"
                  :id="`placeholder-${fieldName}`"
                  v-model="fieldData.placeholder"
                  :placeholder="`Default: ${getDefaultPlaceholder(fieldName as keyof typeof fieldConfigs)}`"
                  :disabled="
                    fieldName !== 'postalCode' &&
                    fieldName !== 'cardInformation' &&
                    !fieldData.enabled
                  "
                />
              </div>
            </div>
          </template>

          <button @click="initializeAndMountDropin" style="margin-top: 20px">
            Initialize & Mount Drop-in
          </button>
        </div>
        <!-- End of .config-section -->
      </div>
      <!-- END: Configuration Column -->

      <div class="display-column">
        <div class="dropin-section">
          <h2>Drop-in Area:</h2>
          <div id="odin-dropin-container" ref="dropinContainerRef">
            <!-- The ODIN Drop-in will be mounted here -->
          </div>
        </div>

        <div class="results-section">
          <h2>Results:</h2>
          <div v-if="paymentMethodId" class="success-message">
            <p>
              Success! Payment Method ID: <code>{{ paymentMethodId }}</code>
            </p>

            <div v-if="paymentResult" class="payment-details-subsection">
              <p v-if="paymentResult.paymentMethodType">
                <strong>Type:</strong>
                <code>{{ paymentResult.paymentMethodType }}</code>
              </p>

              <div
                v-if="
                  paymentResult.paymentMethodType === 'CARD' &&
                  paymentResult.details
                "
              >
                <h4>Card Details:</h4>
                <p v-if="paymentResult.details.cardBrand">
                  <strong>Brand:</strong>
                  <code>{{ paymentResult.details.cardBrand }}</code>
                </p>
                <p v-if="paymentResult.details.last4">
                  <strong>Last 4:</strong>
                  <code>{{ paymentResult.details.last4 }}</code>
                </p>
                <p v-if="paymentResult.details.maskedAccountNumber">
                  <strong>Masked Number:</strong>
                  <code>{{ paymentResult.details.maskedAccountNumber }}</code>
                </p>
                <p v-if="paymentResult.details.expirationDate">
                  <strong>Expires:</strong>
                  <code>{{ paymentResult.details.expirationDate }}</code>
                </p>
                <div v-if="paymentResult.details.binDetails">
                  <strong>BIN Details:</strong>
                  <pre><code style="white-space: pre-wrap;">{{ JSON.stringify(paymentResult.details.binDetails, null, 2) }}</code></pre>
                </div>
              </div>
              <!-- TODO: Add v-if for ACH details here in the future -->
            </div>
            <!-- END: Display New Payment Method Details -->

            <div
              v-if="paymentResult?.billingInformation"
              class="billing-details-subsection"
            >
              <strong>Billing Information Received:</strong>
              <pre><code style="white-space: pre-wrap;">{{ JSON.stringify(paymentResult.billingInformation, null, 2) }}</code></pre>
            </div>
            <div v-else class="billing-details-subsection">
              <p><em>No billing information returned in result.</em></p>
            </div>
          </div>

          <div v-if="displayedError" class="error-message">
            <p v-if="displayedError.code">
              <strong>Error Code:</strong>
              <code>{{ displayedError.code }}</code>
            </p>
            <p v-if="displayedError.message">
              <strong>Message:</strong>
              <code>{{ displayedError.message }}</code>
            </p>
            <div v-if="displayedError.httpStatusCode">
              <p>
                <strong>HTTP Status:</strong>
                <code>{{ displayedError.httpStatusCode }}</code>
              </p>
            </div>
            <div
              v-if="
                displayedError.fieldErrors &&
                displayedError.fieldErrors.length > 0
              "
            >
              <p><strong>Field Specific Errors:</strong></p>
              <ul style="text-align: left; margin-left: 20px">
                <li v-for="(fe, idx) in displayedError.fieldErrors" :key="idx">
                  <code
                    ><strong>{{ fe.field }}:</strong> {{ fe.message }}</code
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <!-- Display Column -->
    </div>
    <!-- End main layout container -->
  </div>
  <!-- End of .demo-container -->
</template>

<style scoped>
/* Enhanced Demo App Styling */
.demo-container {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  padding: 30px;
  /* max-width: 550px; Slightly narrower */
  margin: 40px auto; /* More top/bottom margin */
  border: 1px solid #e2e8f0; /* Lighter border */
  border-radius: 8px;
  background-color: #f8f9fa; /* Slightly off-white */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Subtle shadow */
  color: #4a5568; /* Default text color */
}

h1 {
  text-align: center;
  color: #2d3748; /* Darker heading */
  margin-bottom: 30px;
  font-weight: 600;
}

.config-section,
.dropin-section,
.results-section {
  margin-bottom: 30px;
  padding: 25px;
  border: 1px solid #e2e8f0; /* Solid, lighter border */
  border-radius: 6px;
  background-color: #ffffff; /* White background for contrast */
}

.config-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600; /* Bold labels */
  color: #4a5568;
  font-size: 0.95em;
}

.config-section input[type="text"] {
  width: 100%; /* Use 100% width */
  box-sizing: border-box; /* Include padding/border in width */
  padding: 12px; /* More padding */
  margin-bottom: 15px;
  border: 1px solid #cbd5e0; /* Slightly darker border */
  border-radius: 4px;
  font-size: 1em;
  transition:
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.config-section input[type="text"]:focus {
  border-color: #4299e1; /* Blue border on focus */
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* Blue glow on focus */
  outline: none;
}

.config-section button {
  padding: 11px 20px;
  background-color: #48bb78; /* Nicer green */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
}

.config-section button:hover {
  background-color: #38a169; /* Darker green */
}

/* styles for field config layout */
.config-section h2,
.config-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2d3748;
  font-weight: 600;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 10px;
}
.config-section h3 {
  font-size: 1.1em;
}
.field-config-item {
  border: 1px solid #e2e8f0;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  background-color: #f8f9fa;
}
.field-config-item h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1em;
  font-weight: 600;
  color: #4a5568;
}
.field-config-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.field-config-row label {
  width: 150px; /* Fixed width for alignment */
  min-width: 150px;
  margin-right: 10px;
  margin-bottom: 0; /* Override default block label margin */
  text-align: right;
  font-weight: 500;
  font-size: 0.9em;
}
.field-config-row input[type="text"] {
  flex-grow: 1;
  margin-bottom: 0; /* Override default input margin */
  padding: 8px 10px; /* Smaller padding */
  font-size: 0.95em;
}
.field-config-row input[type="checkbox"] {
  margin-left: 0;
  margin-right: 5px; /* Space after checkbox */
}

.global-config-section {
  background-color: #ffffff; /* Match other sections */
  padding: 25px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 30px; /* Space before the two-column layout */
}

.global-config-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2d3748;
  font-weight: 600;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 10px;
}

.global-config-row {
  display: flex;
  align-items: flex-start; /* Align items to the top for multi-line labels */
  margin-bottom: 15px;
  gap: 20px; /* Space between items in a row */
}

.global-config-row .full-width-input {
  flex-grow: 1; /* Make token input take full width */
}

.global-config-row.multi-control-row > div {
  flex: 1; /* Distribute space among control groups */
  display: flex;
  flex-direction: column; /* Stack label and select/checkbox */
}
.global-config-row.multi-control-row > div.checkbox-group {
  flex-direction: row; /* Align checkbox and its label horizontally */
  align-items: center; /* Center checkbox with its label */
  flex-grow: 0.5; /* Give it a bit less space if needed */
}

.global-config-row label {
  /* font-weight: 600; */ /* Already in .config-section label, but can be specific if needed */
  margin-bottom: 8px; /* Space between label and control */
  display: block; /* Ensure label is on its own line if not in a flex row with input */
  color: #4a5568;
  font-size: 0.95em;
}
.global-config-row .checkbox-group label {
  margin-bottom: 0; /* Reset margin for checkbox label */
  margin-left: 8px; /* Space between checkbox and its label */
  font-weight: normal; /* Make it normal weight */
}

.global-config-row input[type="text"],
.global-config-row select {
  width: 100%; /* Make inputs/selects take full width of their container */
  box-sizing: border-box;
  padding: 12px;
  /* margin-bottom: 0; */ /* Removed as row has margin-bottom */
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1em;
}
.global-config-row input[type="checkbox"] {
  /* Checkbox specific styles if needed, often browser default is fine */
  margin-top: 0; /* Align with other controls if labels are above */
}

/* Accessibility helper for visually hidden labels */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Adjustments for the h3 in config-column */
.config-column .config-section h3 {
  margin-top: 0;
  border-top: none;
  padding-top: 0;
}

/* END: Styles for Global Configuration Section */

/* Ensure layout-container still works as expected */
.layout-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  /* margin-top: 30px; */ /* This might be redundant if global-config-section has margin-bottom */
}

.layout-container {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens if needed */
  gap: 30px; /* Space between the columns */
  margin-top: 30px; /* Add some space below the main title */
}

.config-column {
  flex: 1; /* Allow config column to grow/shrink */
  min-width: 350px; /* Minimum width before wrapping */
  /* max-width: 50%; */ /* Optional: Limit max width */
}

.display-column {
  flex: 1; /* Allow display column to grow/shrink */
  min-width: 350px; /* Minimum width before wrapping */
  /* max-width: 50%; */ /* Optional: Limit max width */
}

/* Adjustments for sections within columns */
.config-column .config-section,
.display-column .dropin-section,
.display-column .results-section {
  margin-bottom: 0; /* Remove bottom margin as gap handles spacing */
}

.radio-group-pmt {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between radio options */
}
.radio-group-pmt input[type="radio"] {
  margin-right: 5px;
}
.radio-group-pmt label {
  margin-bottom: 0; /* Override default label block margin */
  font-weight: normal;
}

.display-column .results-section {
  margin-top: 30px; /* Add space between dropin and results */
}

/* --- Adjustments for responsiveness --- */
@media (max-width: 600px) {
  .field-config-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .field-config-row label {
    width: auto;
    min-width: auto;
    text-align: left;
    margin-bottom: 5px;
  }
  .field-config-row input[type="text"] {
    width: 100%; /* Full width on small screens */
  }
}

.dropin-section h2,
.results-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2d3748;
  font-weight: 600;
  font-size: 1.2em;
  border-bottom: 1px solid #edf2f7; /* Lighter border */
  padding-bottom: 10px;
}

label[for="enableNameField"] + input[type="checkbox"] {
  vertical-align: middle;
}

#odin-dropin-container {
  min-height: 150px;
  padding: 5px; /* Reduced padding to let internal component spacing dominate */
}

.results-section code {
  font-family:
    "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  background-color: #edf2f7; /* Lighter grey background */
  padding: 4px 6px;
  border-radius: 4px;
  word-break: break-all;
  color: #4a5568;
  font-size: 0.9em;
}

.results-section .success-message pre code {
  display: block; /* Make it take the full width for text-align */
  text-align: left; /* Align JSON to the left */
  white-space: pre-wrap; /* Ensure wrapping */
  word-break: break-all; /* Ensure long strings break */
  background-color: #e6fffa; /* Slightly different background for the pre block */
  padding: 10px;
  border: 1px solid #c6f6d5;
  border-radius: 4px;
  margin-top: 5px;
}

.payment-details-subsection,
.billing-details-subsection {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #9ae6b4; /* Light green border */
}

.payment-details-subsection h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2f855a; /* Darker green to match success text */
  font-size: 1em;
  font-weight: 600;
}

.payment-details-subsection p,
.billing-details-subsection p {
  margin-bottom: 5px; /* Tighter spacing for detail lines */
}

.results-section .success-message {
  text-align: left; /* Ensure overall success message content aligns left */
}

.success-message {
  color: #2f855a; /* Darker green */
  background-color: #f0fff4; /* Very light green */
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #9ae6b4; /* Green border */
  margin-top: 10px;
  font-weight: 500;
}

.error-message {
  color: #c53030; /* Darker red */
  background-color: #fff5f5; /* Very light red */
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #feb2b2; /* Red border */
  margin-top: 10px;
  font-weight: 500;
}

.config-section select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1em;
  background-color: white; /* Ensure it has a background on dark themes if not reset globally */
  color: #4a5568; /* Ensure text color is readable */
}

.config-section select:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  outline: none;
}

/* --- Styling elements INSIDE the Stencil Component --- */
/* Use :deep() */

/* Style the Submit Button */
:deep(.odin-submit-button) {
  padding: 11px 20px;
  background-color: #4299e1; /* Blue */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
}

:deep(.odin-submit-button:hover) {
  background-color: #2b6cb0; /* Darker blue */
}

:deep(.odin-submit-button:disabled) {
  opacity: 0.5; /* Slightly less opaque */
  cursor: not-allowed;
  background-color: #a0aec0; /* Grey background when disabled */
}

/* Style the Error Message Container */
:deep(.odin-error-message-container) {
  color: #c53030;
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  padding: 12px;
  margin-top: 20px; /* More space above error */
  font-size: 0.9em;
  border-radius: 5px;
  text-align: left; /* Align error text left */
}

/* Style the field labels */
:deep(.odin-field-container label) {
  display: block;
  margin-bottom: 6px; /* Slightly more space below label */
  font-weight: 500; /* Slightly bolder */
  font-size: 0.9em;
  color: #4a5568;
}

/* Style the field container div (subtle adjustments) */
:deep(.odin-input) {
  /* We rely on the OdinPay theme for border/background/etc */
  /* Just ensure it behaves like a block */
  display: block;
  width: 100%;
}

/* Container for the Pay button */
:deep(.odin-submit-container) {
  margin-top: 25px; /* More space above button */
}
</style>
