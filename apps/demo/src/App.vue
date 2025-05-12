<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { OdinDropin } from "@exerp/odin-dropin";
import type {
  OdinPayErrorPayload,
  BillingFieldsConfig,
} from "@exerp/odin-dropin";

// --- State ---
const odinPublicToken = ref("");
const countryCode = ref<"US" | "CA">("US");
const enableNameField = ref(false);
const dropinContainerRef = ref<HTMLElement | null>(null);
const paymentMethodId = ref<string | null>(null);
const displayedError = ref<OdinPayErrorPayload | null>(null);
let odinDropinInstance: OdinDropin | null = null; // To store the instance

const currentBillingFieldsConfig = computed<BillingFieldsConfig>(() => {
  return {
    name: enableNameField.value,
    // 📝 Future: add other fields here based on their refs
    // addressLine1: enableAddressLine1.value,
  };
});

// --- Methods ---
async function initializeAndMountDropin() {
  paymentMethodId.value = null;
  displayedError.value = null;
  console.log("Attempting to initialize Drop-in...");

  if (!odinPublicToken.value) {
    displayedError.value = {
      code: "DEMO_APP_VALIDATION",
      message: "Please provide an ODIN Public Token.",
    };
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
    return;
  }

  if (!dropinContainerRef.value) {
    displayedError.value = {
      code: "DEMO_APP_ERROR",
      message: "Drop-in container element not found.",
    };
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
      `[DemoApp] Initializing OdinDropin with token: ${odinPublicToken.value}, country: ${countryCode.value}`
    );
    // Actual Drop-in Initialization Logic
    odinDropinInstance = new OdinDropin({
      odinPublicToken: odinPublicToken.value,
      countryCode: countryCode.value,
      isSingleUse: true,
      billingFieldsConfig: currentBillingFieldsConfig.value,
      config: {
        // theme: { primaryColor: '#007bff' } // Example theme
      },
      onSubmit: (result) => {
        console.log("Demo App onSubmit:", result);
        paymentMethodId.value = result.paymentMethodId;
        displayedError.value = null;
      },
      onError: (error) => {
        console.error("Demo App onError:", error);
        displayedError!.value = error;
        paymentMethodId.value = null;
      },
    });

    // Pass the actual HTMLElement to mount
    odinDropinInstance.mount(dropinContainerRef.value);
    console.log("Drop-in mount called on:", dropinContainerRef.value);
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

    <div class="config-section">
      <div>
        <label for="publicToken">ODIN Public Token:</label>
        <input
          id="publicToken"
          type="text"
          v-model="odinPublicToken"
          placeholder="Paste your test public token here"
        />
      </div>

      <div style="margin-top: 15px">
        <label for="countryCode">Country Code:</label>
        <select id="countryCode" v-model="countryCode">
          <option value="US">US - United States</option>
          <option value="CA">CA - Canada</option>
        </select>
      </div>

      <div style="margin-top: 15px">
        <label
          for="enableNameField"
          style="display: inline-block; margin-right: 10px"
        >
          Enable "Name on Card" field:
        </label>
        <input type="checkbox" id="enableNameField" v-model="enableNameField" />
      </div>

      <!-- 📝 Majid: Future fields like isSingleUse toggle and other billing fields will go here or in a sub-section -->

      <button @click="initializeAndMountDropin" style="margin-top: 20px">
        Initialize & Mount Drop-in
      </button>
    </div>

    <div class="dropin-section">
      <h2>Drop-in Area:</h2>
      <div id="odin-dropin-container" ref="dropinContainerRef">
        <!-- The ODIN Drop-in will be mounted here -->
      </div>
    </div>

    <div class="results-section">
      <h2>Results:</h2>
      <div v-if="paymentMethodId" class="success-message">
        Success! Payment Method ID: <code>{{ paymentMethodId }}</code>
      </div>
      <div v-if="displayedError" class="error-message">
        <p v-if="displayedError.code">
          <strong>Error Code:</strong> <code>{{ displayedError.code }}</code>
        </p>
        <p v-if="displayedError.message">
          <strong>Message:</strong> <code>{{ displayedError.message }}</code>
        </p>
        <div v-if="displayedError.httpStatusCode">
          <p>
            <strong>HTTP Status:</strong>
            <code>{{ displayedError.httpStatusCode }}</code>
          </p>
        </div>
        <div
          v-if="
            displayedError.fieldErrors && displayedError.fieldErrors.length > 0
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
</template>

<style scoped>
/* Enhanced Demo App Styling */
.demo-container {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  padding: 30px;
  max-width: 550px; /* Slightly narrower */
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
