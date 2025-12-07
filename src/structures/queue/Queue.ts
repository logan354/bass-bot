import { User } from "discord.js";

import { QueueableAudioMedia } from "../AudioMedia";
import { RepeatMode } from "../../utils/constants";

export default class Queue {
    items: QueueableAudioMedia[] = [];

    previousItems: QueueableAudioMedia[] = [];

    repeatMode: RepeatMode = RepeatMode.OFF;

    lock: boolean = true;

    nextVoteList: User[] = [];

    previousVoteList: User[] = [];

    /**
     * Add an item to this queue
     * @param item 
     * @param position 
     */
    add(item: QueueableAudioMedia, position?: number) {
        if (position !== undefined) this.items.splice(position, 0, item);
        else this.items.push(item);
    }

    /**
     * Get an item from this queue
     * @param index 
     * @returns
     */
    get(index: number): QueueableAudioMedia {
        return this.items[index];
    }

    /**
     * Remove a item from this queue
     * @param index 
     */
    remove(index: number) {
        this.items.splice(index, 1);
    }

    /**
     * Move to the next item, or a position in the queue
     * @param position
     * @returns 
     */
    next(position?: number) {
        if (this.isEmpty()) return;

        if (position && position < 1) return;

        const currentItem = this.items[0];

        if (position) {
            for (let i = 0; i < position + 1; i++) {
                if (this.repeatMode === RepeatMode.ALL) {
                    const currentItem = this.items[0];

                    this.items.shift();
                    this.items.push(currentItem);
                }
                else if (this.repeatMode == RepeatMode.OFF) {
                    this.items.shift();
                }
            }
        }
        else {
            if (this.repeatMode === RepeatMode.ALL) {
                this.items.shift();
                this.items.push(currentItem);
            }
            else if (this.repeatMode == RepeatMode.OFF) {
                this.items.shift();
            }
        }

        if (this.repeatMode !== RepeatMode.ONE) {
            this.previousItems.unshift(currentItem);
        }

        this.lock = false;
    }

    /**
     * Move to the next item in the previous queue
     * @returns 
     */
    previous() {
        if (this.isEmpty() || this.isPreviousEmpty()) return;

        const currentItem = this.items[0];
        const previousItem = this.previousItems[0];

        if (this.repeatMode === RepeatMode.ALL) {
            this.items.unshift(this.items[this.items.length - 1]);
            this.previousItems.unshift(currentItem);
        }
        else {
            this.items.unshift(previousItem);
            this.previousItems.shift();
        }
    }

    /**
     * Move an item in this queue
     * @param index 
     * @param position 
     */
    move(index: number, position: number) {
        this.items.splice(position, 0, ...this.items.splice(index, 1));
    }

    /**
     * Clears the queue
     */
    clear() {
        this.items.splice(1);
        this.previousItems.splice(0);
        this.previousVoteList.splice(0);
        this.nextVoteList.splice(0);
    }

    /**
     * Shuffles this queue
     */
    shuffle() {
        if (this.isEmpty()) return;

        const currentItem = this.items[0];
        this.items.shift();

        for (let i = this.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
        }

        this.items.unshift(currentItem);
    }

    /**
     * Whether this queue is empty
     * @returns 
     */
    public isEmpty(): boolean {
        if (!this.items.length) return true;
        else return false;
    }

    /**
     * Whether the previous queue is empty
     * @returns 
     */
    public isPreviousEmpty(): boolean {
        if (!this.previousItems.length) return true;
        else return false;
    }
}