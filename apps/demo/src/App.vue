<script setup lang="ts">
import { ref, onMounted } from 'vue';
// TODO: Import OdinDropin from '@exerp/odin-dropin' later

// --- State ---
const odinPublicToken = ref(''); // Input for the public token
const dropinContainerRef = ref<HTMLElement | null>(null); // Ref for the mount point
const paymentMethodId = ref<string | null>(null); // To display the result
const errorMessage = ref<string | null>(null); // To display errors

// --- Methods ---
function initializeAndMountDropin() {
  paymentMethodId.value = null;
  errorMessage.value = null;
  console.log('Attempting to initialize Drop-in...'); // Placeholder log

  if (!odinPublicToken.value) {
    errorMessage.value = 'Please provide an ODIN Public Token.';
    return;
  }

  if (!dropinContainerRef.value) {
    errorMessage.value = 'Drop-in container element not found.';
    return;
  }

  // TODO: Actual Drop-in Initialization Logic Here
  // Example (will be implemented later):
  // try {
  //   const dropin = new OdinDropin({
  //     odinPublicToken: odinPublicToken.value,
  //     isSingleUse: true, // Example for MVP
  //     config: {
  //       theme: { primaryColor: '#007bff' } // Example theme
  //     },
  //     onSubmit: (result) => {
  //       console.log('Drop-in onSubmit:', result);
  //       paymentMethodId.value = result.paymentMethodId;
  //     },
  //     onError: (error) => {
  //       console.error('Drop-in onError:', error);
  //       errorMessage.value = `Error: ${error.code} ${error.message ? '- ' + error.message : ''}`;
  //     }
  //   });
  //   dropin.mount(dropinContainerRef.value); // Pass the actual element
  //   console.log('Drop-in mount called.');
  // } catch (error) {
  //   console.error('Failed to initialize or mount Drop-in:', error);
  //   errorMessage.value = 'Failed to initialize Drop-in instance.';
  // }

  // Placeholder for now:
  errorMessage.value = "Drop-in logic not yet implemented.";

}

// --- Lifecycle ---
onMounted(() => {
  // We could potentially auto-mount if a token was pre-filled,
  // but manual mounting via button is clearer for demo purposes.
});

</script>

<template>
  <div class="demo-container">
    <h1>Exerp ODIN Drop-in Demo (Vue + TS)</h1>

    <div class="config-section">
      <label for="publicToken">ODIN Public Token:</label>
      <input
        id="publicToken"
        type="text"
        v-model="odinPublicToken"
        placeholder="Paste your test public token here"
      />
      <button @click="initializeAndMountDropin">Initialize & Mount Drop-in</button>
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
      <div v-if="errorMessage" class="error-message">
        Error: <code>{{ errorMessage }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  font-family: sans-serif;
  padding: 20px;
  max-width: 600px;
  margin: 40px auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.config-section,
.dropin-section,
.results-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px dashed #ddd;
  border-radius: 4px;
}

.config-section label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.config-section input[type="text"] {
  width: calc(100% - 22px); /* Adjust for padding/border */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.config-section button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.config-section button:hover {
  background-color: #0056b3;
}

#odin-dropin-container {
  min-height: 100px; /* Ensure it has some space */
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.results-section h2 {
  margin-bottom: 10px;
}

.success-message {
  color: green;
  background-color: #e9f7ef;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #b4e3cd;
}

.error-message {
  color: red;
  background-color: #fdeded;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #f1aeae;
}

code {
  font-family: monospace;
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 3px;
}
</style>