import { ethers } from 'ethers';
import abi from './abi/LIGHTTHEJOINT.json';

const CONTRACT_ADDRESS = "Y0x5e4C6B87B644430Fa71F9158B5292808756b7D44";

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, abi, providerOrSigner);
};
